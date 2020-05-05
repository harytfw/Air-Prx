export type int128 = [number, number, number, number];

export type CIDR = [number, number];

export type CIDR_V6 = [int128, int128];

export interface ProxyInfo {
    type: string,

    id?: string,
    refId?: string,
    host?: string,
    port?: number,
    username?: string,
    password?: string,
    proxyDNS?: boolean,
    proxyAuthorizationHeader?: string,
}

export enum ProxyResult {
    proxy,
    notProxy,
    continue,
}

export type SubType = 'builtin_china_ip' | 'builtin_gfw' | 'cidr' | 'gfw' | 'base64_gfw' | 'autoproxy';
export type MatchType = 'ip' | 'std' | 'hostname' | 'void' | 'container';

export interface GroupConfig {
    name: string,
    enable: boolean,
    proxyInfo: ProxyInfo,
    rules?: string[],
    subSource?: string,
    subType?: SubType,
    matchType: MatchType,
}

export interface GroupSummary {
    name: string,
    proxyInfo: ProxyInfo,
    matchType: string,
}

export type Feature = 'limit_my_ip' | 'ipv6' | 'debug' | 'container' | 'history';
export const ALL_FEATURES: Feature[] = ['limit_my_ip', 'ipv6', 'history', 'debug', 'container'];

export interface Configuration {
    features: Feature[]
    groups: GroupConfig[],
    subscriptions?: string[], // 全局订阅源
    myIp?: string;
    myIpList?: string[],
}

export interface RequestSummary {
    url: string,
    hostName: string,
    protocol: string,
    documentUrl?: string,
    documentHostName?: string,
    cookieStoreId?: string,
    ipAddress?: string,
}


export const HTTP = 'http://';
export const HTTPS = 'https://';
export const BLANK_CONFIG: Configuration = {
    features: [],
    groups: [],
}

export const TEST_PROXY: ProxyInfo = {
    type: 'http',
    host: '127.0.0.1',
    port: 1081
}

export type ExtEvent = 'getCache' | 'clearCache' | 'updateMyIp' | 'setProxyState';

export type ExtEventMessage = {
    name: ExtEvent,
    data?: any,
}

export interface History {
    event: string,
    request?: RequestSummary,
    groupConfig?: GroupSummary,
} 