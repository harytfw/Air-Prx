
import './pac-types';
import Core from "../bg/core";
import { debugLog, extractDomainAndProtocol } from '../util'
import { IpRuleGroup, VoidRuleGroup } from '../group';
import * as types from '../types';
const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };
const TEST_PROXY: types.ProxyInfo = {
    type: 'http',
    host: '127.0.0.1',
    port: 1081,
}

export class PacCore extends Core {
    constructor() {
        super();
    }

    pLog(arg) {
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
        this.pLog('start check group');
        for (let i = 0; i < this.groups.length; i++) {
            const g = this.groups[i];
            // this.pLog(`check group, name:${g.name}, prototype: ${Object.getPrototypeOf(g)}`);
            // this.pLog('proxy info: ')
            // this.pLog(g.proxyInfo);
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
