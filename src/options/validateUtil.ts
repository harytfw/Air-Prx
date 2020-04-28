import * as types from '../types';
type PrimitiveType = 'string' | 'object' | 'number' | 'boolean' | 'undefined';

function propExist(prop: any) {
    return typeof prop !== 'undefined';
}

function checkURL(url: any) {
    try {
        new URL(url);
        return true;
    } catch (ex) {
        return false;
    }
}

function requireType(val: any, type: PrimitiveType): boolean {
    return typeof val === type;
}

function requireArray(val: any, type: PrimitiveType): boolean {
    if (!Array.isArray(val)) {
        return false;
    }
    if (val.length === 0) return true;
    for (const v of val) {
        requireType(v, type);
    }
    return true;
}

function maybeThisType(val: any, type: PrimitiveType) {
    if (val === undefined || val === null) {
        return true;
    }
    return requireType(val, type);
}

export function checkFeatures(features: types.Feature[]) {
    const ALL_FEATURES: types.Feature[] = ['limit_my_ip', 'ipv6', 'history', 'debug', 'container'];
    for (const f of features) {
        if (!ALL_FEATURES.includes(f)) {
            throw new Error('contain unknown feature');
        }
    }
}

export function checkMatchType(type: any) {
    const ALL_MATCH_TYPE: types.MatchType[] = ['std', 'container', 'hostname', 'ip', 'void'];
    return ALL_MATCH_TYPE.includes(type);
}

export function checkSubType(type: any) {
    if (type === undefined) {
        return true;
    }
    const ALL_SUBTYPE: types.SubType[] = ['autoproxy', 'base64_gfw', 'builtin_china_ip', 'builtin_gfw', 'cidr', 'gfw'];
    return ALL_SUBTYPE.includes(type);
}

export function checkProxyType(type: any) {
    const ALL_PROXY_TYPE: string[] = ['http', 'direct', 'socks'];
    return ALL_PROXY_TYPE.includes(type);
}

export function checkProxyInfo(proxyInfo: types.ProxyInfo) {
    checkProxyType(proxyInfo.type);
    maybeThisType(proxyInfo.id, 'string');
    maybeThisType(proxyInfo.proxyDNS, 'boolean');
    maybeThisType(proxyInfo.refId, 'string');
    maybeThisType(proxyInfo.proxyAuthorizationHeader, 'string');
    if (propExist(proxyInfo.host)) {
        requireType(proxyInfo.host, 'string')
        requireType(proxyInfo.port, 'number');
    }
    if (propExist(proxyInfo.username)) {
        requireType(proxyInfo.username, 'string');
        requireType(proxyInfo.password, 'string');
    }
}

export function checkProxyRef(config: types.Configuration) {
    const set: Set<string> = new Set();
    for (const g of config.groups) {
        if (g.proxyInfo.id) {
            set.add(g.proxyInfo.id);
        }
    }
    for (const g of config.groups) {
        if (g.proxyInfo.refId) {
            if (!set.has(g.proxyInfo.refId)) {
                return false;
            }
        }
    }
    return true;
}

export function checkRules(matchType: types.MatchType, rules?: string[], ) {
    if (matchType === 'std') {
        requireArray(rules, 'string');
    } else if (matchType === 'ip') {
        requireArray(rules, 'string');
        for (const cidr of rules!) {
            checkCIDR(cidr);
        }
    }
}

export function checkGroupConfig(group: types.GroupConfig) {
    requireType(group.proxyInfo, 'object');
    checkProxyInfo(group.proxyInfo);
    requireType(group.name, 'string');
    requireType(group.enable, 'boolean');
    checkMatchType(group.matchType);
    checkRules(group.matchType, group.rules);
    checkSubType(group.subType);
    if (propExist(group.subSource)) {
        checkURL(group.subSource);
    }
}

export function checkGroups(groups: types.GroupConfig[]) {
    for (const g of groups) {
        requireType(g, 'object');
        checkGroupConfig(g);
    }
}

export function checkMyIp(config: types.Configuration) {
    return true;
}

export function checkIp(ip: string) {
    const parts: string[] = ip.split('.');
    if (parts.length !== 4) return false;
    for (const a of parts) {
        const n = parseInt(a);
        if (n < 0 || n > 255) {
            return false;
        }
    }
    return true;
}

export function checkCIDR(cidr: string) {
    const parts: string[] = cidr.split('/');
    if (parts.length !== 2) return false;
    const prefixlen = parseInt(parts[1]);
    return checkIp(parts[0]!) && prefixlen >= 0 && prefixlen <= 32;
}

export function checkConfig(config: types.Configuration) {
    checkFeatures(config.features);
    checkGroups(config.groups);
    checkProxyRef(config);
    checkMyIp(config);
}