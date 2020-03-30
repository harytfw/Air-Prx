import { TrieNode, TrieNodeMeta } from './trie'
const HTTP = 'http://';
const HTTPS = 'https://';
export default class Core {
    root: TrieNode;
    debug: boolean;
    skip: Set<string>;
    constructor() {
        this.root = new TrieNode();
        this.skip = new Set();
        this.debug = false;
    }

    _notSupport(rule: string) {
        // throw new Error("not support rule: " + rule);
        console.warn("not support rule: " + rule);
    }
    _getMetasFromDomain(domain: string) {
        const arr = domain.split('.').reverse();
        const metas: (TrieNodeMeta | null)[] = [];
        for (let i = 0; i < arr.length; i++) {
            metas.push(this.root.getMeta(Array.from(arr).splice(i), 0));
        }
        return metas;
    }
    clear() {
        this.root = new TrieNode();
        this.skip = new Set();
    }
    addRule(rule: string) {
        const meta = new TrieNodeMeta();
        if (rule.startsWith("@@")) {
            meta.exception = true;
            rule = rule.substring(2);
        }
        if (rule.startsWith('.')) {
            meta.isParentDomain = true;
            rule = rule.substring(1);
        } else if (rule.startsWith('||')) {
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
        // console.log('after process: ' + rule)
        if (rule.includes('/')) {
            this._notSupport(rule);
            return;
        }
        const path = rule.split('.').reverse();
        meta.path = path;
        this.root.insert(path, 0, meta);
    }
    isMatch(url: string) {
        if (this.debug) {
            console.time('matcher');
        }
        // console.log('url:', url);
        let slashIndex = url.indexOf('//');
        let lastSlashIndex = url.indexOf('/', slashIndex + 2);
        let domainName: string;
        if (lastSlashIndex >= 0) {
            // console.log('slashIndex:', slashIndex);
            domainName = url.substring(slashIndex + 2, lastSlashIndex);
        } else {
            domainName = url.substring(slashIndex + 2, url.length);
        }
        if (this.skip.has(domainName)) {
            this.debug && console.timeEnd('matcher');
            return false;
        }
        const protocol = url.substring(0, slashIndex + 2);
        const path = domainName.split('.').reverse();
        const meta = this.root.getMeta(path, 0);
        const except = meta && meta.exception;
        let res = false;
        if (this.debug) {
            console.log(url, protocol, path, 'meta:', meta);
        }
        for (; ;) {
            if (meta === null) {
                res = false;
                break;
            }

            if (meta.isParentDomain) {
                res = meta.path.length < path.length;
                break;
            }

            if (meta.exact) {
                res = meta.exactProtocol === protocol && meta.path.length === path.length;
                break;
            }

            res = true;
            break
        }

        if (this.debug) {
            console.timeEnd('matcher');
        }
        const final = !except && res;
        if (!final) {
            this.skip.add(domainName);
        }
        return final;
    }

    isMatchWithTimer(url) {
        console.time('matcher');
        const r = this.isMatch(url);
        console.timeEnd('matcher');
        return r;
    }
}
