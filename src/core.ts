import { TrieNode, TrieNodeMeta } from './trie'
const HTTP = 'http://';
const HTTPS = 'https://';
const EMPTY_CACHE = new Set<string>();
export default class Core {
    root: TrieNode;
    debug: boolean;
    normalCache: Set<string>;
    exceptionRoot: TrieNode;
    exceptionCache: Set<string>;
    reExps: RegExp[];
    initCompleteFlag: boolean;
    cache: Map<string, boolean>;
    subStrings: string[];
    constructor() {
        this.root = new TrieNode();
        this.exceptionRoot = new TrieNode();
        this.normalCache = new Set();
        this.exceptionCache = new Set();
        this.reExps = [];
        this.debug = false;
        this.cache = new Map();
        this.subStrings = [];
        this.initCompleteFlag = false;
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
        this.normalCache = new Set();
    }
    addRule(rule: string) {
        const meta = new TrieNodeMeta();
        if (rule.startsWith("@@")) {
            meta.exception = true;
            rule = rule.substring(2);
        }
        if (rule.startsWith('.')) {
            this.subStrings.push(rule);
            return;
        } else if (rule.startsWith('||')) {
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
        } else if (rule.startsWith('/')) {
            this.reExps.push(new RegExp(rule.substr(1, rule.length - 1)));
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
        if (meta.exception) {
            this.exceptionRoot.insert(path, 0, meta);
        } else {
            this.root.insert(path, 0, meta);
        }
    }

    setDebug(d) {
        if (d) {
            this.cache.clear();
        }
        this.debug = d;
    }

    initComplete() {
        this.root.sort();
        this.exceptionRoot.sort();
        this.initCompleteFlag = true;
    }

    isMatch(url: string) {
        if (!this.initComplete) {
            console.error("not complete init");
            return false;
        }
        return this.isMatchInternal(url, this.root)
    }

    isMatchInternal(url: string, node: TrieNode) {
        let t0 = 0;
        if (this.debug) {
            t0 = performance.now();
        }
        let useCache = false;
        let res = false;
        let domainName: string;
        outer:
        for (; ;) {
            // console.log('url:', url);
            let slashIndex = url.indexOf('//');
            let lastSlashIndex = url.indexOf('/', slashIndex + 2);

            if (lastSlashIndex >= 0) {
                // console.log('slashIndex:', slashIndex);
                domainName = url.substring(slashIndex + 2, lastSlashIndex);
            } else {
                domainName = url.substring(slashIndex + 2, url.length);
            }

            if (this.cache.has(domainName)) {
                useCache = true;
                res = this.cache.get(domainName)!;
                break
            }

            const protocol = url.substring(0, slashIndex + 2);

            let path = domainName.split('.').reverse();
            const meta = node.getMeta(path, 0, this.debug);


            if (meta === null) {

                for (const re of this.reExps) {
                    if (re.test(domainName)) {
                        if (this.debug) {
                            console.log("match regexp", re);
                        }
                        res = true;
                        break outer;
                    }
                }

                for (const str of this.subStrings) {
                    if (url.includes(str)) {
                        if (this.debug) {
                            console.log("match substring", str);
                        }
                        res = true;
                        break outer;
                    }
                }

                res = false;
                break;
            }

            if (meta.isParentDomain) {
                res = meta.path.length <= path.length;
                break;
            }

            if (meta.exact) {
                res = meta.exactProtocol === protocol && meta.path.length === path.length;
                break;
            }

            res = true;
            break;
        }
        if (!useCache && !this.debug) {
            this.cache.set(domainName, res);
        }
        if (this.debug) {
            let t1 = performance.now();
            console.info(url, "takes", t1 - t0, 'ms')
        }
        return res;
    }

    isMatchWithTimer(url) {
        console.time('matcher');
        const r = this.isMatch(url);
        console.timeEnd('matcher');
        return r;
    }
}
