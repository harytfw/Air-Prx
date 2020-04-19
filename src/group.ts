import { TrieNode, TrieNodeMeta } from "./trie";

import { debugLog } from './log';
import { extractDomainAndProtocol, ipToInt32 } from "./util";
import * as types from "./types";
import ruleLoader from "./rule-loader";

const HTTP = 'http://';
const HTTPS = 'https://';

type Cache = Map<string, types.ProxyResult>;

export class RuleGroup {

    proxyCache: Cache;
    useCache: boolean;
    root: TrieNode;
    regExps: RegExp[];
    subStrings: string[];
    ipMask: number[][];
    proxyInfo: any;
    name: string;
    internalRules: string[];
    internalIpAddress: string[];
    useDocumentUrl: boolean;
    subSource: string;
    subType: string;
    useIpAddress: boolean;

    constructor(proxyInfo: types.ProxyInfo, name: string) {
        this.name = name;
        this.subType = "";
        this.subSource = "";
        this.root = new TrieNode();
        this.proxyCache = new Map();
        this.useCache = true;
        this.useDocumentUrl = false;
        this.useIpAddress = false;
        this.regExps = [];
        this.subStrings = [];
        this.internalRules = [];
        this.internalIpAddress = [];
        this.ipMask = [];
        this.proxyInfo = proxyInfo;
    }

    _getMetasFromDomain(domain: string) {
        const arr = domain.split('.').reverse();
        const metas: (TrieNodeMeta | null)[] = [];
        for (let i = 0; i < arr.length; i++) {
            metas.push(this.root.getMeta(Array.from(arr).splice(i), 0));
        }
        return metas;
    }

    _notSupport(rule: string) {
        // throw new Error("not support rule: " + rule);
        console.warn("not support rule: " + rule);
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
            if (rule.startsWith(HTTP)) {
                meta.exactProtocol = HTTP;
                rule = rule.substring(HTTP.length);
            } else if (rule.startsWith(HTTPS)) {
                meta.exactProtocol = HTTPS;
                rule = rule.substring(HTTPS.length);
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

    addIpAddress(ipAddrWithMask: string) {
        let int32Ip = ipToInt32(ipAddrWithMask.substring(0, ipAddrWithMask.lastIndexOf('/')));
        const maskLen = parseInt(ipAddrWithMask.substring(ipAddrWithMask.lastIndexOf('/') + 1));
        let mask = 0;
        for (let i = 31, len = maskLen; i >= 0 && len > 0; i--, len--) {
            mask = 1 << i | mask;
        }
        debugLog('addIpAddress', ipAddrWithMask, int32Ip, maskLen, mask)
        this.ipMask.push([int32Ip, mask]);
    }

    enableCache() {

    }

    disableCache() {

    }

    sort() {
        this.root.sort();
        this.subStrings.sort();
    }

    getProxyResult_IP(ipAddr: string) {
        const int32Ip = ipToInt32(ipAddr);
        for (const mask of this.ipMask) {
            if ((mask[1] & int32Ip) === mask[0]) {
                return Promise.resolve(types.ProxyResult.proxy);
            }
        }
        return Promise.resolve(types.ProxyResult.continue);
    }

    getProxyResult(url: string): Promise<types.ProxyResult> {
        let t0 = performance.now();
        let found = false;
        const [domainName, protocol] = extractDomainAndProtocol(url);

        if (this.useCache && this.proxyCache.has(domainName)) {
            return Promise.resolve(this.proxyCache.get(domainName)!);
        }

        const path = domainName.split('.').reverse();
        const meta = this.root.getMeta(path, 0);
        outer: for (; ;) {

            if (meta === null) {
                for (const re of this.regExps) {
                    if (re.test(domainName)) {
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

        if (this.useCache) {
            this.proxyCache.set(domainName, res);
        }

        let t1 = performance.now();
        debugLog(url, "takes", t1 - t0, 'ms in group:', this.name);

        return Promise.resolve(res);
    }

    toJSON(): types.PlainGroupObject {
        return {
            name: this.name,
            proxyInfo: this.proxyInfo,
            internalRules: this.internalRules,
            subType: this.subType,
            subSource: this.subSource,
            useDocumentUrl: this.useDocumentUrl,
            useIpAddress: this.useIpAddress,
        }
    }

    static fromJSON(obj: types.PlainGroupObject) {
        const g = new RuleGroup(obj.proxyInfo, obj.name);
        g.subSource = obj.subSource ? obj.subSource : "";
        g.subType = obj.subType ? obj.subType : "";
        g.useDocumentUrl = Boolean(obj.useDocumentUrl);
        g.useIpAddress = Boolean(obj.useIpAddress);
        for (const r of obj.internalRules) {
            g.addRule(r);
        }
        return g;
    }
}
