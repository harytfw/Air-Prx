import { TrieNode, TrieNodeMeta } from '../trie'
import { lowerBound, extractDomainAndProtocol } from '../util'
import { RuleGroup } from '../group';
import { debugLog } from '../log';
import * as types from '../types';
import { IpRuleGroup } from '../ip-rule-group';
import { StdRuleGroup } from '../std-rule-group';
import { BaseRuleGroup } from '../base-rule-group';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

export default class Core {

    groups: BaseRuleGroup[];

    constructor() {
        this.groups = [];

    }

    sortAll() {
        this.groups.forEach(g => {
            if (g instanceof StdRuleGroup) {
                g.sort();
            }
        });
    }

    buildRequestSummary(requestInfo) {
        const [hostname, protocol] = extractDomainAndProtocol(requestInfo.url);
        const summary: types.RequestSummary = {
            url: requestInfo.url,
            documentUrl: requestInfo.documentUrl,
            hostName: hostname,
            protocol: protocol,
        }
        return summary;
    }

    async fillIpAddress(summary: types.RequestSummary) {
        const address = await browser.dns.resolve(summary.hostName);
        return address;
    }

    async getProxy(requestInfo): Promise<types.ProxyInfo> {
        const summary = this.buildRequestSummary(requestInfo);
        for (const g of this.groups) {
            if (g instanceof IpRuleGroup) {
                await this.fillIpAddress(summary);
            }
            const result = await g.getProxyResult(summary);
            if (result === types.ProxyResult.proxy) {
                debugLog(summary.url, 'use', g.proxyInfo);
                return Promise.resolve(g.proxyInfo);
            }
            if (result === types.ProxyResult.notProxy) {
                debugLog(summary.url, 'not use proxy');
                return Promise.resolve(DIRECT_PROXYINFO);
            }
        }
        debugLog(summary.url, ' did not match rule , no proxy is used');
        return Promise.resolve(DIRECT_PROXYINFO);
    }

    fromConfig(config: types.Configuration) {
        this.groups = config.groups.map(g => {
            if (g.useIpAddress) {
                return new IpRuleGroup(g.name, g.proxyInfo, g.internalRules);
            } else {
                return new StdRuleGroup(g.name, g.proxyInfo, g.internalRules);
            }
            RuleGroup.fromJSON(g)
        });
        debugLog(this.groups);
    }
}
