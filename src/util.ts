import * as types from "./types";

import stringify from 'stringify-object';
import ipaddr from 'ipaddr.js';

import { BaseRuleGroup } from "./group";

export function lowerBound(array: string[], start: number, end: number, i: number, target: string, j: number) {
    if (start >= end) {
        return -1;
    }
    while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        if (array[mid].charAt(i) > target.charAt(j)) {
            end = mid - 1;
        } else {
            start += 1;
        }
    }
    return start;
}

export function upperBound(array: string[], start: number, end: number, i: number, target: string, j: number) {
    if (start >= end) {
        return -1;
    }
    while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        if (array[mid].charAt(i) <= target.charAt(j)) {
            end -= 1;
        } else {
            start = mid + 1;
        }
    }
    return end;
}

export function extractDomainAndProtocol(url: string) {
    let domainName: string;
    let slashIndex = url.indexOf('//');
    let lastSlashIndex = url.indexOf('/', slashIndex + 2);

    if (lastSlashIndex >= 0) {
        // console.log('slashIndex:', slashIndex);
        domainName = url.substring(slashIndex + 2, lastSlashIndex);
    } else {
        domainName = url.substring(slashIndex + 2, url.length);
    }

    const protocol = url.substring(0, slashIndex + 2);
    return [domainName, protocol];
}


export function ipToInt32(ip: string): number {
    let ipArr = ip.split('.').map(a => parseInt(a));
    if (ipArr.length !== 4) {
        throw new Error("incorrect ip format");
    }
    let int32 = ipArr[0] << 24 | ipArr[1] << 16 | ipArr[2] << 8 | ipArr[3];
    return int32;
}

export function toCIDR(strCidr: string): types.CIDR {
    let int32Ip = ipToInt32(strCidr.substring(0, strCidr.lastIndexOf('/')));
    const maskLen = parseInt(strCidr.substring(strCidr.lastIndexOf('/') + 1));
    let mask = 0;
    for (let i = 31, len = maskLen; i >= 0 && len > 0; i--, len--) {
        mask = 1 << i | mask;
    }
    return [int32Ip, mask];
}

export function ipv6ToInt128(ip: string): types.int128 {
    const ipv6 = ipaddr.IPv6.parse(ip);
    return ipv6.parts as types.int128;
}

export function int128_AND(a: types.int128, b: types.int128): types.int128 {
    return [a[0] & b[0], a[1] & b[1], a[2] & b[2], a[3] & b[3]]
}

export function int128_EQ(a: types.int128, b: types.int128): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

export function toCIDR_V6(strCidr: string): types.CIDR_V6 {
    const [ipv6, maskLen] = ipaddr.IPv6.parseCIDR(strCidr);
    const subnet: number[] = [];
    subnet.push(...ipv6.parts);
    const mask: number[] = [];
    mask.push(...ipaddr.IPv6.subnetMaskFromPrefixLength(maskLen).parts);
    return [subnet, mask] as types.CIDR_V6;
}

export function isCIDRMatch(cidr: types.CIDR, ip: number) {
    return (ip & cidr[1]) === cidr[0];
}

export function isCIDRV6Match(cidr: types.CIDR_V6, ip: types.int128) {
    return int128_EQ(cidr[0], int128_AND(ip, cidr[1]))
}

export function enableDebugLog() {
    (globalThis as any).debug = true;
}

export function disableDebugLog() {
    (globalThis as any).debug = false;
}

export function debugLog(...args) {
    if (typeof window === 'object' && (window as any).debug === true) {
        console.debug(...args);
    }
    if (typeof window === 'undefined') { // PAC
        if (args.length === 1) {
            alert(stringify(args[0]));
        } else {
            alert(stringify(args))
        }
    }
}

export async function buildCookieStoreIdMap() {
    const map = new Map<string, string>();
    const cis = await browser.contextualIdentities.query({});
    for (const ci of cis) {
        map.set(ci.name, ci.cookieStoreId);
    }
    return map;
}


export function isPAC() {
    return typeof window === 'undefined';
}



export async function getMyIp(): Promise<string> {
    return fetch('http://ip-api.com/json/').then(a => a.json()).then(data => {
        debugLog('query ip info', data);
        return Promise.resolve(data.query)
    })
}


export function constructorName(obj: Object): string {
    return obj.constructor.name;
}

export function clone<T>(val: T): T {
    return JSON.parse(JSON.stringify(val));
}

export function buildGroupSummary(group: BaseRuleGroup): types.GroupSummary {
    return {
        name: group.name,
        proxyInfo: group.proxyInfo,
        matchType: constructorName(group),
    }
}

export function buildRequestSummary(requestInfo) {
    const [hostname, protocol] = extractDomainAndProtocol(requestInfo.url);
    let siteHostName;
    if (requestInfo.documentUrl) {
        siteHostName = extractDomainAndProtocol(requestInfo.documentUrl)[0];
    }
    const summary: types.RequestSummary = {
        url: requestInfo.url,

        hostName: hostname,
        protocol: protocol,

        documentUrl: requestInfo.documentUrl,
        documentHostName: siteHostName,
        cookieStoreId: requestInfo.cookieStoreId,
    }
    return summary;
}

export function isFirefox() {
    return !isChromium();
}

export function isChromium() {
    return navigator.userAgent.includes("Chrome");
}