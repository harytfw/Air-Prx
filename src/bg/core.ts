import { TrieNode, TrieNodeMeta } from '../trie'
import { lowerBound, upperBound } from '../util'
import { RuleGroup } from '../group';
import { debugLog } from '../log';
import * as types from '../types';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

export default class Core {

    groups: RuleGroup[];

    constructor() {
        this.groups = [];
        // this.groups.push(new RuleGroup(DIRECT_PROXYINFO, 'exception'));
        // this.groups.push(new RuleGroup({
        //     type: 'socks',
        //     host: '127.0.0.1',
        //     port: 10808,
        // }, "custom"));
    }

    addExceptionRule(rule: string) {
        this.groups.find(a => a.name === 'exception')!.addRule(rule);
    }

    addCustomRule(rule: string) {
        this.groups.find(a => a.name === 'custom')!.addRule(rule);
    }

    createGroup(rules: string[], proxyInfo, name) {
        const g = new RuleGroup(proxyInfo, name);
    }

    addGroup(plainGroup: types.PlainGroupObject) {
        const g = RuleGroup.fromJSON(plainGroup);
        debugLog('add group', g);
        this.groups.push(g);
    }

    sortAll() {
        this.groups.forEach(g => g.sort());
    }

    async getProxy(url: string, documentUrl?: string): Promise<types.ProxyInfo> {
        for (const g of this.groups) {
            const u = g.useDocumentUrl ? documentUrl : url;
            if (typeof u !== 'string') {
                continue;
            }
            const result = await g.getProxyResult(u);
            if (result === types.ProxyResult.proxy) {
                debugLog(u, 'use', g.proxyInfo);
                return Promise.resolve(g.proxyInfo);
            }
            if (result === types.ProxyResult.notProxy) {
                debugLog(u, 'not use proxy');
                return Promise.resolve(DIRECT_PROXYINFO);
            }
        }
        debugLog(url, ' did not match rule , no proxy is used');
        return Promise.resolve(DIRECT_PROXYINFO);
    }

    toConfig(): types.Configuration {
        return {
            features: [],
            groups: this.groups.map(g => g.toJSON())
        }
    }

    fromConfig(config: types.Configuration) {
        this.groups = config.groups.map(g => RuleGroup.fromJSON(g));
        debugLog(this.groups);
    }
}
