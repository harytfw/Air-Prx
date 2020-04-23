
import { extractDomainAndProtocol, ipToInt32, debugLog } from '../util'
import * as types from '../types';
import { Cache } from '../proxy-cache';
import { IpRuleGroup, StdRuleGroup, BaseRuleGroup, VoidRuleGroup, HostNameRuleGroup } from '../group'
import { PersistedLogger } from '../persisted-logger';
import { threadId } from 'worker_threads';
import { MyIpMatcher } from '../myip-matcher';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

export default class Core {

    groups: BaseRuleGroup[];
    proxyInfoMap: Map<string, types.ProxyInfo>;
    useCache: boolean;
    cache: Cache<string, types.ProxyInfo>;
    persistedLogger: PersistedLogger;
    features: Set<types.Feature>;

    myIpMatcher?: MyIpMatcher;

    tempDisable: boolean;

    constructor() {
        this.groups = [];
        this.proxyInfoMap = new Map();
        this.useCache = true;
        this.cache = new Cache();
        this.persistedLogger = new PersistedLogger('log');
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
        if (typeof id === 'string' && this.proxyInfoMap.has(id)) {
            return this.proxyInfoMap.get(id)!;
        }
        return proxyInfo;
    }

    pLog(obj: any) {
        if (this.features.has('log')) {
            this.persistedLogger.add(obj);
        }
    }

    async fillIpAddress(summary: types.RequestSummary) {
        const record = await browser.dns.resolve(summary.hostName);
        summary.ipAddress = record.addresses[0];
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
        this.pLog('start getProxy process');
        this.pLog(requestInfo);

        const summary = this.buildRequestSummary(requestInfo);
        debugLog(JSON.stringify(summary));
        this.pLog('summary: ')
        this.pLog(summary);

        const key = this.computeKey(summary);
        let pInfo: types.ProxyInfo | null = null;
        if (this.cache.has(key)) {
            pInfo = this.cache.get(key)!;
            debugLog('hit cache', key, pInfo);
            this.pLog('hit cache, key: ' + key);
            this.pLog(pInfo);
            return Promise.resolve(pInfo);
        }
        this.pLog('start check group');
        for (const g of this.groups) {
            this.pLog(`check group, name:${g.name}, prototype: ${Object.getPrototypeOf(g)}`);
            this.pLog('proxy info: ')
            this.pLog(g.proxyInfo);
            if (g instanceof IpRuleGroup) {
                this.pLog('start feach dns');
                await this.fillIpAddress(summary);
                this.pLog('fetch dns done');
                this.pLog(summary);
            }
            const result = g.getProxyResult(summary);
            if (result === types.ProxyResult.proxy) {
                this.pLog('proxy result: PROXY')
                pInfo = this.resolveProxyInfo(g.proxyInfo);
                break;
            } else if (result === types.ProxyResult.notProxy) {
                this.pLog('proxy result: NOT PROXY');
                pInfo = this.resolveProxyInfo(DIRECT_PROXYINFO);
                break;
            } else if (result === types.ProxyResult.continue) {
                this.pLog('proxy result: CONTINUE');
            }
        }
        this.pLog('end check group');

        if (pInfo === null) {
            this.pLog(`didn't match any group, use DIRECT`)
            pInfo = DIRECT_PROXYINFO;
        }

        if (this.useCache) {
            this.cache.set(key, pInfo);
        }

        this.pLog('end process');
        return Promise.resolve(pInfo);
    }

    comparator(a: types.GroupConfig, b: types.GroupConfig) {
        let oa = a.order === undefined ? Number.MAX_SAFE_INTEGER : a.order;
        let ob = b.order === undefined ? Number.MAX_SAFE_INTEGER : b.order;
        return oa - ob;
    }

    fromConfig(config: types.Configuration) {
        debugLog(config);
        this.tempDisable = true;
        this.pLog('load from configuration');
        config.features.forEach(f => this.features.add(f));
        this.pLog('features: ' + config.features);

        for (const g of config.groups) {
            this.pLog('detect group: ' + g.name);
            this.pLog('enable: ' + g.enable);
            this.pLog('order: ' + g.order);
            this.pLog('subSource: ' + g.subSource)
            this.pLog('subType: ' + g.subType)
            this.pLog('matchType: ' + g.matchType)
            this.pLog('proxy.type: ' + g.proxyInfo.type);
            this.pLog('rules length: ' + g.rules?.length);
        }

        this.pLog('init proxyInfoMap');
        config.groups.map(g => g.proxyInfo)
            .filter(item => typeof item.id === 'string')
            .forEach(item => {
                this.proxyInfoMap.set(item.id!, item);
            })

        this.pLog('process groups');
        this.groups = config.groups
            .filter(g => g.enable)
            .sort(this.comparator)
            .map(g => {
                this.pLog(`init group: ${g.name} , matchType: ${g.matchType}`);
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

