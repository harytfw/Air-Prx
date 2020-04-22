
import { extractDomainAndProtocol } from '../util'
import { debugLog } from '../log';
import * as types from '../types';
import { IpRuleGroup } from '../group/ip-rule-group';
import { StdRuleGroup } from '../group/std-rule-group';
import { BaseRuleGroup } from '../group/base-rule-group';
import { Cache } from '../proxy-cache';
import { VoidRuleGroup } from '../group/void-rule-group';
import { HostNameRuleGroup as HostNameRuleGroup } from '../group/hostname-rule-group';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

export default class Core {

    groups: BaseRuleGroup[];
    proxyInfoMap: Map<string, types.ProxyInfo>;
    useCache: boolean;
    cache: Cache<string, types.ProxyInfo>;
    constructor() {
        this.groups = [];
        this.proxyInfoMap = new Map();
        this.useCache = true;
        this.cache = new Cache();
    }

    sortAll() {
        this.groups.forEach(g => {
            if (g instanceof StdRuleGroup) {
                g.sort();
            }
        });
    }

    disableCache() {
        this.useCache = false;
        this.cache.clear();
    }

    enableCache() {
        this.useCache = true;
    }

    computeKey(summary: types.RequestSummary) {
        return summary.hostName;
    }

    resolveProxyInfo(proxyInfo: types.ProxyInfo): types.ProxyInfo {
        const id = proxyInfo.refId;
        if (typeof id === 'string' && this.proxyInfoMap.has(id)) {
            return this.proxyInfoMap.get(id)!;
        }
        return proxyInfo;
    }

    async fillIpAddress(summary: types.RequestSummary) {
        const record = await browser.dns.resolve(summary.hostName);
        summary.ipAddress = record.addresses[0];
    }

    async getProxy(requestInfo): Promise<types.ProxyInfo> {
        const summary = this.buildRequestSummary(requestInfo);
        const key = this.computeKey(summary);
        let pInfo: types.ProxyInfo | null = null;
        if (this.cache.has(key)) {
            pInfo = this.cache.get(key)!;
            debugLog('hit cache', key, pInfo);
            return Promise.resolve(pInfo);
        }
        for (const g of this.groups) {
            if (g instanceof IpRuleGroup) {
                await this.fillIpAddress(summary);
            }
            const result = g.getProxyResult(summary);
            if (result === types.ProxyResult.proxy) {
                debugLog(summary.url, 'use', g.proxyInfo);
                pInfo = this.resolveProxyInfo(g.proxyInfo);
                break;
            }
            if (result === types.ProxyResult.notProxy) {
                debugLog(summary.url, 'not use proxy');
                pInfo = this.resolveProxyInfo(DIRECT_PROXYINFO);
                break;
            }
        }
        if (pInfo === null) {
            debugLog(summary, 'did not match rule , not proxy is used');
            pInfo = DIRECT_PROXYINFO;
        }
        if (this.useCache) {
            this.cache.set(key, pInfo);
        }
        return Promise.resolve(pInfo);
    }

    comparator(a: types.GroupConfig, b: types.GroupConfig) {
        let oa = a.order === undefined ? Number.MAX_SAFE_INTEGER : a.order;
        let ob = b.order === undefined ? Number.MAX_SAFE_INTEGER : b.order;
        return oa - ob;
    }

    fromConfig(config: types.Configuration) {
        config.groups.map(g => g.proxyInfo)
            .filter(item => typeof item.id === 'string')
            .forEach(item => {
                this.proxyInfoMap.set(item.id!, item);
            })

        this.groups = config.groups
            .filter(g => g.enable)
            .sort(this.comparator)
            .map(g => {
                switch (g.matchType) {
                    case 'hostname':
                        return new HostNameRuleGroup(g.name, g.proxyInfo);
                    case 'void':
                        return new VoidRuleGroup(g.name, g.proxyInfo);
                    case 'ip':
                        return new IpRuleGroup(g.name, g.proxyInfo, g.rules ? g.rules : []);
                    case 'std':
                    default:
                        return new StdRuleGroup(g.name, g.proxyInfo, g.rules ? g.rules : []);
                }
            });
        debugLog(this.groups);
    }


    buildRequestSummary(requestInfo) {
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
        }
        return summary;
    }

}

