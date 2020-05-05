import './types';
import * as types from '../types';
import { PacCore, buildPacCore } from './pac-core';
import { debugLog } from '../util';


const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

const TEST_PROXY: types.ProxyInfo = {
    type: 'http',
    host: '127.0.0.1',
    port: 1080,
}

function formateProxyInfo(proxyInfo: types.ProxyInfo) {
    if (proxyInfo.type === 'direct') {
        return 'DIRECT';
    }
    const detail = `${proxyInfo.host}:${proxyInfo.port}`;
    if (proxyInfo.type === 'http') {
        return `PROXY ${detail}`;
    }
    if (proxyInfo.type === 'https') {
        return `PROXY ${detail}`
    }
    if (proxyInfo.type === 'socks5') {
        return `SOCKS5 ${detail}`
    }
    return 'DIRECT'
}

let core: PacCore | null = null;

function init_PAC() {
    let config = "CONFIG_REPLACE_MARKER" as any;
    if (typeof config === "string") {
        throw new Error('PLEASE REPLACE CONFIG');
    }
    debugLog(config);
    core = buildPacCore(config);
    debugLog('success build pac core');
}

function FindProxyForURL(url: string, host: string): string {
    if (!core) {
        return 'DIRECT';
    }
    const proxyInfo = core!.getProxy_PAC(url, host);
    const formated = formateProxyInfo(proxyInfo);
    return formated;
}

globalThis.FindProxyForURL = FindProxyForURL;
init_PAC();