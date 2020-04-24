import './pac-types';
import { debugLog, extractDomainAndProtocol } from '../src/util'
import * as types from '../src/types';
import Core from '../src/bg/core'
import { IpRuleGroup, VoidRuleGroup } from '../src/group';
const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };
const TEST_PROXY: types.ProxyInfo = {
    type: 'http',
    host: '127.0.0.1',
    port: 1081,
}


class PacCore extends Core {
    constructor() {
        super();
    }

    pLog(arg) {
        return;
        if (typeof arg !== 'string') {
            alert(JSON.stringify(arg));
        } else {
            alert(arg);
        }
    }

    fillIpAddress_PAC(summary: types.RequestSummary) {
        if (summary.ipAddress === undefined) {
            // this.pLog('start resolve ip');
            summary.ipAddress = dnsResolve(summary.hostName);
            // this.pLog(summary.ipAddress);
        }
    }

    getProxy_PAC(url: string, host: string): types.ProxyInfo {
        const [_, protocol] = extractDomainAndProtocol(url);
        const summary: types.RequestSummary = {
            url,
            hostName: host,
            protocol,
        };

        // if (this.myIpMatcher && !this.myIpMatcher.isAllow()) {
        //     return DIRECT_PROXYINFO;
        // }
        // this.pLog('start getProxy process');
        // this.pLog('summary: ')
        // this.pLog(summary);
        const key = this.computeKey(summary);
        let pInfo: types.ProxyInfo | null = null;

        if (this.cache.has(key)) {
            pInfo = this.cache.get(key)!;
            debugLog('hit cache', key, pInfo);
            this.pLog('hit cache, key: ' + key);
            this.pLog(pInfo);
            return pInfo;
        }
        // return TEST_PROXY;
        // this.groups = [new VoidRuleGroup('void', TEST_PROXY)]
        this.pLog('start check group');
        for (let i = 0; i < this.groups.length; i++) {
            const g = this.groups[i];
            // this.pLog(`check group, name:${g.name}, prototype: ${Object.getPrototypeOf(g)}`);
            // this.pLog('proxy info: ')
            // this.pLog(g.proxyInfo);
            return TEST_PROXY;
            if (g instanceof IpRuleGroup) {
                this.fillIpAddress_PAC(summary);
            }

            const result = g.getProxyResult(summary);
            if (result === types.ProxyResult.proxy) {
                this.pLog('proxy result: PROXY')
                pInfo = this.resolveProxyInfo(g.proxyInfo);
                break;
            } else if (result === types.ProxyResult.notProxy) {
                this.pLog('proxy result: NOT PROXY');
                pInfo = this.resolveProxyInfo(DIRECT_PROXYINFO);
                break;
            } else if (result === types.ProxyResult.continue) {
                this.pLog('proxy result: CONTINUE');
            }
        }

        this.pLog('end check group');
        if (pInfo === null) {
            this.pLog(`didn't match any group, use DIRECT`)
            pInfo = DIRECT_PROXYINFO;
        }

        if (this.useCache) {
            this.cache.set(key, pInfo);
        }

        this.pLog('end process');
        return pInfo;
    }

}

let core: PacCore | null = null;

function init() {
    //START_REPLACE
    let config = types.BLANK_CONFIG;
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
    // return 'PROXY 127.0.0.1:1081';
    if (!core) {
        return 'DIRECT';
    }
    const [_, protocol] = extractDomainAndProtocol(url);
    const proxyInfo = core!.getProxy_PAC(url, host);
    const formated = formateProxyInfo(proxyInfo);
    // alert(formated);
    return formated;
}


globalThis.FindProxyForURL = FindProxyForURL;
init();