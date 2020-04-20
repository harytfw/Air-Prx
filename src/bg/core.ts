
import { extractDomainAndProtocol } from '../util'
import { debugLog } from '../log';
import * as types from '../types';
import { IpRuleGroup } from '../ip-rule-group';
import { StdRuleGroup } from '../group/std-rule-group';
import { BaseRuleGroup } from '../group/base-rule-group';
import { Cache } from '../proxy-cache';
import { VoidRuleGroup } from '../group/void-rule-group';
import { HostNameRuleGroup as HostNameRuleGroup } from '../group/hostname-rule-group';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

export default class Core {

    groups: BaseRuleGroup[];
    cache: Cache<string, types.ProxyInfo>;
    constructor() {
        this.groups = [];
        this.cache = new Cache();
    }

    sortAll() {
        this.groups.forEach(g => {
            if (g instanceof StdRuleGroup) {
                g.sort();
            }
        });
    }


    computeKey(summary: types.RequestSummary) {
        return summary.hostName;
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
                pInfo = g.proxyInfo;
                break;
            }
            if (result === types.ProxyResult.notProxy) {
                debugLog(summary.url, 'not use proxy');
                pInfo = DIRECT_PROXYINFO;
                break;
            }
        }
        if (pInfo === null) {
            debugLog(summary, 'did not match rule , not proxy is used');
            pInfo = DIRECT_PROXYINFO;
        }
        this.cache.set(key, pInfo);
        return Promise.resolve(pInfo);
    }

    comparator(a: types.GroupConfig, b: types.GroupConfig) {
        let oa = a.order === undefined ? Number.MAX_SAFE_INTEGER : a.order;
        let ob = b.order === undefined ? Number.MAX_SAFE_INTEGER : b.order;
        return oa - ob;
    }

    fromConfig(config: types.Configuration) {
        this.groups = config.groups
            .filter(g => g.enable)
            .sort(this.comparator)
            .map(g => {
                switch (g.matchType) {
                    case 'hostName':
                        return new HostNameRuleGroup(g.name, g.proxyInfo);
                    case 'void':
                        return new VoidRuleGroup(g.name, g.proxyInfo);
                    case 'ipAddress':
                        return new IpRuleGroup(g.name, g.proxyInfo, g.rules);
                    case 'standard':
                    default:
                        return new StdRuleGroup(g.name, g.proxyInfo, g.rules);
                }
            });
        debugLog(this.groups);
    }

    
    buildRequestSummary(requestInfo) {
        const [hostname, protocol] = extractDomainAndProtocol(requestInfo.url);
        const [siteHostName, _] = extractDomainAndProtocol(requestInfo.documentUrl);
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

