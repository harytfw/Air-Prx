
import { extractDomainAndProtocol, ipToInt32, debugLog, enableDebugLog, disableDebugLog, buildCookieStoreIdMap, constructorName } from '../util'
import * as types from '../types';
import { Cache } from '../proxy-cache';
import { IpRuleGroup, StdRuleGroup, BaseRuleGroup, VoidRuleGroup, HostNameRuleGroup } from '../group'
import { MyIpMatcher } from '../myip-matcher';
import { ContainerGroup } from '../group/container-group';
import { debuglog } from 'util';

const DIRECT_PROXYINFO: types.ProxyInfo = { type: "direct" };

const CACHE_NAME = '__CACHE__';

export default class Core {

    groups: BaseRuleGroup[];
    proxyInfoMap: Map<string, types.ProxyInfo>;
    useCache: boolean;
    caches: Map<string, Cache<string, types.ProxyInfo>>;
    features: Set<types.Feature>;

    myIpMatcher: MyIpMatcher;

    tempDisable: boolean;

    constructor() {
        this.groups = [];
        this.proxyInfoMap = new Map();
        this.useCache = true;
        // this.persistedLogger = new PersistedLogger('log');
        this.features = new Set();
        this.tempDisable = false;
        this.myIpMatcher = new MyIpMatcher([], 0);
        this.caches = new Map();
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

        for (const cache of this.caches.values()) {
            cache.clear();
        }
    }

    enableCache() {
        this.useCache = true;
    }

    computeKey(summary: types.RequestSummary) {
        return summary.hostName;
    }

    computeCache(summary: types.RequestSummary) {
        const cacheName = this.features.has('container') && summary.cookieStoreId ? summary.cookieStoreId : CACHE_NAME;
        let cache = this.caches.get(cacheName);
        if (!cache) {
            cache = new Cache();
            this.caches.set(cacheName, cache);
        }
        return cache;
    }

    resolveProxyInfo(proxyInfo: types.ProxyInfo): types.ProxyInfo {
        const id = proxyInfo.refId;
        if (id !== undefined && this.proxyInfoMap.has(id)) {
            return this.proxyInfoMap.get(id)!;
        }
        return proxyInfo;
    }

    async updateMyIP() {
        this.tempDisable = true;
        await this.myIpMatcher.updateMyIp();
        this.tempDisable = false;
    }

    async fillIpAddress(summary: types.RequestSummary) {
        if (typeof summary.ipAddress !== 'string') {
            debugLog('start feach dns');
            const record = await browser.dns.resolve(summary.hostName);
            summary.ipAddress = record.addresses[0];
            debugLog('fetch dns done');
        }
    }

    async getProxy(requestInfo): Promise<types.ProxyInfo> {
        if (this.tempDisable) {
            debugLog('temporary disable proxy');
            return Promise.resolve(DIRECT_PROXYINFO);
        }

        if (!this.myIpMatcher.isAllow()) {
            debugLog('current ip is not allowed to use proxy');
            return Promise.resolve(DIRECT_PROXYINFO);
        }

        const summary = this.buildRequestSummary(requestInfo);


        let pInfo: types.ProxyInfo | null = null;

        const key = this.computeKey(summary);
        const cache = this.computeCache(summary);
        if (cache.has(key)) {
            pInfo = cache.get(key)!;
            debugLog('hit cache', 'key:', key, 'proxy info:', pInfo);
            return Promise.resolve(pInfo);
        }

        for (const g of this.groups) {

            debugLog('check group', 'name:', g.name, 'type:', constructorName(g));

            if (g instanceof IpRuleGroup && typeof summary.ipAddress !== 'string') {
                await this.fillIpAddress(summary);
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
            cache.set(key, pInfo);
        }

        debugLog('end process');
        return Promise.resolve(pInfo);
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
            cookieStoreId: requestInfo.cookieStoreId,
        }
        return summary;
    }


}


function comparator(a: types.GroupConfig, b: types.GroupConfig) {
    let oa = a.order === undefined ? Number.MAX_SAFE_INTEGER : a.order;
    let ob = b.order === undefined ? Number.MAX_SAFE_INTEGER : b.order;
    return oa - ob;
}

export function buildGroups(groups: types.GroupConfig[], cookieStoreIdMap: Map<string, string>): BaseRuleGroup[] {
    debugLog('cookieStoreIdMap', cookieStoreIdMap);
    for (const g of groups) {
        debugLog('=====')
        debugLog('group: ' + g.name);
        debugLog('enable: ' + g.enable);
        debugLog('order: ' + g.order);
        debugLog('subSource: ' + g.subSource)
        debugLog('subType: ' + g.subType)
        debugLog('matchType: ' + g.matchType)
        debugLog('proxy.type: ' + g.proxyInfo.type);
        debugLog('rules length: ' + g.rules?.length);
        debugLog('=====');
    }
    groups = groups
        .filter(g => g.enable)
        .sort(comparator);
    const ruleGroups: BaseRuleGroup[] = [];
    for (const g of groups) {
        switch (g.matchType) {
            case 'hostname':
                ruleGroups.push(new HostNameRuleGroup(g.name, g.proxyInfo));
                break;
            case 'void':
                ruleGroups.push(new VoidRuleGroup(g.name, g.proxyInfo));
                break;
            case 'ip':
                ruleGroups.push(new IpRuleGroup(g.name, g.proxyInfo, g.rules ? g.rules : []));
                break;
            case 'std':
                ruleGroups.push(new StdRuleGroup(g.name, g.proxyInfo, g.rules ? g.rules : []));
                break;
            case 'container':
                break;
            default:
                console.error('not supported match type: ', g.matchType);
        }
        if (g.matchType === 'container') {
            const containerGroup = buildContainerGroup(g, cookieStoreIdMap);
            if (containerGroup === null) {
                debugLog('can not build container group', g);
            } else {
                ruleGroups.push(containerGroup);
            }
        }
    }
    return ruleGroups;
}

export function buildContainerGroup(groupConfig: types.GroupConfig, cookieStoreIdMap: Map<string, string>) {
    const containerName = groupConfig.containerName ? groupConfig.containerName : '';
    if (!cookieStoreIdMap.has(containerName)) {
        debugLog(`not found container name:`, containerName);
        return null;
    }
    return new ContainerGroup(groupConfig.name, groupConfig.proxyInfo, cookieStoreIdMap.get(containerName)!);
}

export function buildProxyInfoMap(config: types.Configuration) {
    const map = new Map<string, types.ProxyInfo>();
    config.groups.map(g => g.proxyInfo)
        .filter(item => typeof item.id === 'string')
        .forEach(item => {
            map.set(item.id!, JSON.parse(JSON.stringify(item)));
        })
    return map;
}

export async function buildCore(config: types.Configuration): Promise<Core> {
    const core = new Core();
    config.features.forEach(f => core.features.add(f));

    if (core.features.has('debug')) {
        enableDebugLog();
    } else {
        disableDebugLog();
    }

    debugLog('load from configuration');
    debugLog('features', core.features);

    debugLog('init proxyInfoMap');
    core.proxyInfoMap = buildProxyInfoMap(config);

    debugLog('process groups');
    let cookieStoreIdMap = new Map();
    if (core.features.has('container')) {
        cookieStoreIdMap = await buildCookieStoreIdMap();
    }
    core.groups.push(...buildGroups(config.groups, cookieStoreIdMap));
    debugLog(core.groups);
    if (core.features.has('limit_my_ip')) {
        const myIpList = config.myIpList ? config.myIpList : []
        myIpList.forEach(item => core.myIpMatcher.addIp(item));
        if (typeof config.myIp === 'string') {
            core.myIpMatcher.setMyIp(ipToInt32(config.myIp));
        } else {
            core.myIpMatcher.updateMyIp();
        }
    }
    core.sortAll();
    return Promise.resolve(core);
}