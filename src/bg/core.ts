
import { extractDomainAndProtocol, ipToInt32, debugLog, enableDebugLog, disableDebugLog } from '../util'
import * as types from '../types';
import { Cache } from '../proxy-cache';
import { IpRuleGroup, StdRuleGroup, BaseRuleGroup, VoidRuleGroup, HostNameRuleGroup } from '../group'
import { PersistedLogger } from '../persisted-logger';
import { MyIpMatcher } from '../myip-matcher';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

export default class Core {

    groups: BaseRuleGroup[];
    proxyInfoMap: Map<string, types.ProxyInfo>;
    useCache: boolean;
    cache: Cache<string, types.ProxyInfo>;
    // persistedLogger: PersistedLogger;
    features: Set<types.Feature>;

    myIpMatcher?: MyIpMatcher;

    tempDisable: boolean;

    constructor() {
        this.groups = [];
        this.proxyInfoMap = new Map();
        this.useCache = true;
        this.cache = new Cache();
        // this.persistedLogger = new PersistedLogger('log');
        this.features = new Set();
        this.tempDisable = true;
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
        if (id !== undefined && this.proxyInfoMap.has(id)) {
            return this.proxyInfoMap.get(id)!;
        }
        return proxyInfo;
    }

    async fillIpAddress(summary: types.RequestSummary) {
        if (typeof summary.ipAddress !== 'string') {
            const record = await browser.dns.resolve(summary.hostName);
            summary.ipAddress = record.addresses[0];
        }
    }

    async getProxy(requestInfo): Promise<types.ProxyInfo> {
        if (this.tempDisable) {
            debugLog('temporary disable proxy');
            return Promise.resolve(DIRECT_PROXYINFO);
        }

        if (this.myIpMatcher && !this.myIpMatcher.isAllow()) {
            debugLog('current ip is not allowed to use proxy');
            return Promise.resolve(DIRECT_PROXYINFO);
        }

        // debugLog(requestInfo);

        const summary = this.buildRequestSummary(requestInfo);
        debugLog('summary: ')

        const key = this.computeKey(summary);
        let pInfo: types.ProxyInfo | null = null;
        if (this.cache.has(key)) {
            pInfo = this.cache.get(key)!;
            debugLog('hit cache', key, pInfo);
            return Promise.resolve(pInfo);
        }
        for (const g of this.groups) {
            debugLog(`check group, name:${g.name}, prototype: ${Object.getPrototypeOf(g)}`);
            debugLog('proxy info: ')
            debugLog(g.proxyInfo);
            if (g instanceof IpRuleGroup) {
                debugLog('start feach dns');
                await this.fillIpAddress(summary);
                debugLog('fetch dns done');
                debugLog(summary);
            }
            const result = g.getProxyResult(summary);
            if (result === types.ProxyResult.proxy) {
                debugLog('proxy result: PROXY')
                pInfo = this.resolveProxyInfo(g.proxyInfo);
                break;
            } else if (result === types.ProxyResult.notProxy) {
                debugLog('proxy result: NOT PROXY');
                pInfo = this.resolveProxyInfo(DIRECT_PROXYINFO);
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
            this.cache.set(key, pInfo);
        }

        debugLog('end process');
        return Promise.resolve(pInfo);
    }

    comparator(a: types.GroupConfig, b: types.GroupConfig) {
        let oa = a.order === undefined ? Number.MAX_SAFE_INTEGER : a.order;
        let ob = b.order === undefined ? Number.MAX_SAFE_INTEGER : b.order;
        return oa - ob;
    }

    fromConfig(config: types.Configuration) {
        config.features.forEach(f => this.features.add(f));
        if (this.features.has('debug')) {
            enableDebugLog();
        } else {
            disableDebugLog();
        }
        debugLog('load from configuration');
        debugLog('features', this.features);
        this.proxyInfoMap.clear();
        this.tempDisable = true;
        debugLog('features: ' + config.features);
        for (const g of config.groups) {
            debugLog('detect group: ' + g.name);
            debugLog('enable: ' + g.enable);
            debugLog('order: ' + g.order);
            debugLog('subSource: ' + g.subSource)
            debugLog('subType: ' + g.subType)
            debugLog('matchType: ' + g.matchType)
            debugLog('proxy.type: ' + g.proxyInfo.type);
            debugLog('rules length: ' + g.rules?.length);
        }

        debugLog('init proxyInfoMap');
        config.groups.map(g => g.proxyInfo)
            .filter(item => typeof item.id === 'string')
            .forEach(item => {
                this.proxyInfoMap.set(item.id!, item);
            })

        debugLog('process groups');
        const gs = config.groups
            // .filter(g => g.enable)
            // .sort(this.comparator)
            .map(g => {
                // debugLog(`init group: ${g.name} , matchType: ${g.matchType}`);
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
        this.groups.push(...gs);
        debugLog(this.groups);

        if (this.features.has('limit_my_ip')) {
            const myIpList = config.myIpList ? config.myIpList : []
            if (typeof config.myIp === 'string') {
                this.myIpMatcher = new MyIpMatcher(myIpList, ipToInt32(config.myIp));
                this.tempDisable = false;
            } else {
                this.myIpMatcher = new MyIpMatcher(myIpList, 0);
                this.myIpMatcher.updateMyIp().then(() => {
                    this.tempDisable = false;
                })
            }
        } else {
            this.tempDisable = false;
        }
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

