import { debugLog } from "./util";
import * as types from "./types";


const BASE_PATH = './data';

export function loadAutoProxyText(text: string): string[] {
    return text
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => !line.startsWith('!'))
        .filter(line => {
            return line.startsWith('/') || line.startsWith('.') || line.startsWith('@@') || line.startsWith('||') || line.startsWith('|');
        })
}

export function loadCIDR(text: string): string[] {
    return text
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => !line.startsWith('#'))
}

export function loadBuiltinGFW(): Promise<string[]> {
    return fetch(browser.runtime.getURL(BASE_PATH + '/gfwlist.txt'))
        .then(res => res.text())
        .then(text => loadAutoProxyText(text))
}

export function loadBuiltinChinaCIDR(): Promise<string[]> {
    return fetch(browser.runtime.getURL(BASE_PATH + '/china-cidr.txt'))
        .then(res => res.text())
        .then(text => loadCIDR(text));
}


export function loadRemoteGFW(url: string, base64 = false): Promise<string[]> {
    return fetch(url).then(res => res.text())
        .then(text => {
            if (base64) {
                return atob(text);
            }
            return text;
        }).then(text => loadAutoProxyText(text));
}

export function loadRemoteCIDR(url: string, base64 = false): Promise<string[]> {
    return fetch(url).then(res => res.text())
        .then(text => {
            if (base64) return atob(text);
            return text;
        }).then(text => loadCIDR(text));
}

export async function syncConfig(config: types.Configuration) {
    const url = config.subSource;
    if (!url) {
        debugLog('require subcription source');
        return;
    }
    try {
        const text = await fetch(url).then(a => a.text());
        const c = JSON.parse(text) as types.Configuration;
        Object.assign(config, c);
    } catch (ex) {
        debugLog('fail to get sync config: ', ex);
    }
}

function checkSubSource(group: types.GroupConfig) {
    if (!group.subSource) {
        throw new Error('subscription source should be present');
    }
    try {
        new URL(group.subSource);
    } catch (ex) {
        throw new Error('subscription source should be a valid URL');
    }
}

export async function syncGroup(group: types.GroupConfig) {
    let rules: string[] = [];
    debugLog('update subscription ', group);
    switch (group.subType) {
        case undefined:
            break;
        case 'builtin_gfw':
            rules = await loadBuiltinGFW();
            break;
        case 'builtin_china_ip':
            rules = await loadBuiltinChinaCIDR();
            break;
        case 'cidr':
            checkSubSource(group);
            rules = await loadRemoteCIDR(group.subSource!);
            break;
        case 'gfw':
            checkSubSource(group);
            rules = await loadRemoteGFW(group.subSource!);
            break;
        case 'base64_gfw':
            checkSubSource(group);
            rules = await loadRemoteGFW(group.subSource!, true);
            break;
        case 'autoproxy':
            checkSubSource(group);
            rules = await loadRemoteGFW(group.subSource!);
            break;
        default:
            throw new Error(`not supported subscription type: ${group.subType}`)
    }
    if (rules.length > 0) {
        group.rules = rules;
    } else {
        debugLog('the synchronized rules is empty, skip overwrite');
    }
}