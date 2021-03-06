
import './types';
import { Core, buildProxyInfoMap, buildGroups } from "../bg/firefox/core";
import { debugLog, extractDomainAndProtocol, enableDebugLog, disableDebugLog, ipToInt32, constructorName, toCIDR } from '../util'
import { IpRuleGroup } from '../group';
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

    fillIpAddress_PAC(summary: types.RequestSummary) {
        if (summary.ipAddress === undefined) {
            summary.ipAddress = dnsResolve(summary.hostName);
        }
    }

    getProxy_PAC(url: string, host: string): types.ProxyInfo {
        const [_, protocol] = extractDomainAndProtocol(url);
        const summary: types.RequestSummary = {
            url,
            hostName: host,
            protocol,
        };

        const key = this.computeKey(summary);
        const cache = this.computeCache(summary);
        let pInfo: types.ProxyInfo | null = null;
        if (cache.has(key)) {
            pInfo = cache.get(key)!;
            debugLog('hit cache', 'key:', key, 'proxy info:', pInfo);
            return pInfo;
        }
        for (const g of this.groups) {
            debugLog('group name:', g.name, "type:", constructorName(g));
            if (g instanceof IpRuleGroup) {
                this.fillIpAddress_PAC(summary);
            }
            const result = g.getProxyResult(summary);
            if (result === types.ProxyResult.proxy) {
                pInfo = this.resolveProxyInfo(g.proxyInfo);
                debugLog('proxy result: PROXY', pInfo);
                break;
            } else if (result === types.ProxyResult.notProxy) {
                pInfo = this.resolveProxyInfo(DIRECT_PROXYINFO);
                debugLog('proxy result: NOT PROXY');
                break;
            } else if (result === types.ProxyResult.continue) {
                debugLog('proxy result: CONTINUE');
            }
        }
        if (pInfo === null) {
            debugLog(`didn't match any group, use DIRECT`)
            pInfo = DIRECT_PROXYINFO;
        }

        if (this.useCache) {
            cache.set(key, pInfo);
        }

        return pInfo;
    }
}

export function buildPacCore(config: types.Configuration) {

    const core = new PacCore();
    config.features.forEach(f => core.features.add(f));
    if (core.features.has('debug')) {
        enableDebugLog();
    } else {
        disableDebugLog();
    }

    config.groups.forEach(g => {
        if (g.matchType === 'container') {
            debugLog('not support matchType: container in PAC mode');
        }
    });

    config.groups = config.groups.filter(g => g.matchType !== 'container');

    core.proxyInfoMap = buildProxyInfoMap(config);
    core.groups.push(...buildGroups(config.groups, new Map()));
    if (core.features.has('limit_my_ip')) {
        const myIpList = config.myIpList ? config.myIpList : []
        core.myIpMatcher.setMyIpList(myIpList.map(toCIDR));
        if (typeof config.myIp === 'string') {
            core.myIpMatcher.setMyIp(ipToInt32(config.myIp));
        }
    }
    core.sortAll();
    debugLog(core);
    return core;
}