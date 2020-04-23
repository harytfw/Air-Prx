import * as types from '../types';
import { BaseRuleGroup } from './base-rule-group';
import { TrieNode, TrieNodeMeta } from '../trie';
import { debugLog } from '../util';

export class StdRuleGroup extends BaseRuleGroup {
    root: TrieNode;
    regExps: RegExp[];
    subStrings: string[];
    internalRules: string[];
    constructor(name: string, proxyInfo: types.ProxyInfo, rules: string[]) {
        super(name, proxyInfo);
        this.regExps = [];
        this.subStrings = [];
        this.internalRules = [];
        this.root = new TrieNode();

        for (const rule of rules) {
            this.addRule(rule);
        }
    }


    _notSupport(rule: string) {
        // throw new Error("not support rule: " + rule);
        console.warn("not support rule: " + rule);
    }

    sort() {
        this.root.sort();
        this.subStrings.sort();
    }

    addRule(rule: string) {
        this.internalRules.push(rule);

        if (rule.startsWith('.')) {
            this.subStrings.push(rule);
            return;
        }

        if (rule.startsWith('/')) {
            this.regExps.push(new RegExp(rule.substr(1, rule.length - 1)));
            return;
        }


        let isException = false;
        if (rule.startsWith("@@")) {
            isException = true;
            rule = rule.substr(2);
        }

        const meta = new TrieNodeMeta();
        if (rule.startsWith('||')) {
            meta.isParentDomain = true;
            rule = rule.substring(2);
        } else if (rule.startsWith('|')) {
            meta.exact = true;
            rule = rule.substring(1);
            if (rule.startsWith(types.HTTP)) {
                meta.exactProtocol = types.HTTP;
                rule = rule.substring(types.HTTP.length);
            } else if (rule.startsWith(types.HTTPS)) {
                meta.exactProtocol = types.HTTPS;
                rule = rule.substring(types.HTTPS.length);
            } else {
                this._notSupport(rule);
                return;
            }
        } else {
            this._notSupport(rule);
            return;
        }

        meta.exception = isException;
        const path = rule.split('.').reverse();
        meta.path = path;
        this.root.insert(path, 0, meta);
    }


    getProxyResult(summary: types.RequestSummary): types.ProxyResult {
        const { hostName, protocol, url } = summary;
        let t0 = performance.now();
        let found = false;


        const path = hostName.split('.').reverse();
        const meta = this.root.getMeta(path, 0);
        outer: for (; ;) {

            if (meta === null) {
                for (const re of this.regExps) {
                    if (re.test(hostName)) {
                        debugLog("match regexp", re);
                        found = true;
                        break outer;
                    }
                }

                for (const str of this.subStrings) {
                    if (url.includes(str)) {
                        debugLog("match substring", str);
                        found = true;
                        break outer;
                    }
                }

                found = false;
                break;
            } else if (meta.isParentDomain) {
                found = meta.path.length <= path.length;
                break;
            } else if (meta.exact) {
                found = meta.exactProtocol === protocol && meta.path.length === path.length;
                break;
            } else {
                found = true;
                break;
            }
        }
        let res: types.ProxyResult;
        if (!found) {
            res = types.ProxyResult.continue;
        } else if (meta !== null && meta.exception) {
            res = types.ProxyResult.notProxy;
        } else {
            res = types.ProxyResult.proxy;
        }

        let t1 = performance.now();
        debugLog(url, "takes", t1 - t0, 'ms in group:', this.name);

        return res;
    }
}