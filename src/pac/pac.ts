import './pac-types';


import { extractDomainAndProtocol } from '../util'
import * as types from '../types';
import { PacCore } from './pac-core';


const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };
const TEST_PROXY: types.ProxyInfo = {
    type: 'http',
    host: '127.0.0.1',
    port: 1081,
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

function FindProxyForURL(url: string, host: string): string {
    alert('test');
    if (!core) {
        return 'DIRECT';
    }
    const proxyInfo = core!.getProxy_PAC(url, host);
    const formated = formateProxyInfo(proxyInfo);
    // alert(formated);
    return formated;
}



let core: PacCore | null = null;

function init_PAC() {
    //START_REPLACE
    let config = {} as types.Configuration;
    //END_REPLACE
    /*
    config = {
        "features": [
        ],
        "groups": [
            {
                "name": "first-void",
                "proxyInfo": {
                    "type": "http",
                    "host": "127.0.0.1",
                    "port": 1081
                },
                "order": -1,
                "matchType": "void",
                "subSource": "",
                "enable": true
            },
            {
                "name": "void",
                "proxyInfo": {
                    "type": "http",
                    "host": "127.0.0.1",
                    "port": 1081
                },
                "order": 1,
                "matchType": "void",
                "subSource": "",
                "enable": true
            }
        ],
        "myIpList": [
            "116.16.0.0/12"
        ]
    }*/
    core = new PacCore();
    core.fromConfig(config);
}
globalThis.FindProxyForURL = FindProxyForURL;
init_PAC();