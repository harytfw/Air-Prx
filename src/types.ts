export type CIDR = [number, number];

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

export type SubType = 'builtin_china_cidr' | 'builtin_gfw' | 'cidr' | 'gfw' | 'base64_gfw' | 'autoproxy';
export type MatchType = 'document_url' | 'ip' | 'std' | 'hostname' | 'void' | 'context';

export interface GroupConfig {
    name: string,
    enable: boolean,
    proxyInfo: ProxyInfo,
    contextName?: string, //TODO: cookieStoreId
    rules?: string[],
    subSource?: string,
    subType?: SubType,
    matchType?: MatchType,
    order?: number,
}

export type Feature = 'chromium' | 'cache' | 'limit_my_ip' | 'ipv6' | 'log' | 'debug';

export interface Configuration {
    features: Feature[]
    groups: GroupConfig[],
    myIp?: string;
    myIpList?: string[],
}

export interface RequestSummary {
    url: string,
    hostName: string,
    protocol: string,
    documentUrl?: string,
    documentHostName?: string,
    ipAddress?: string,
}

export type Cache = Map<string, ProxyResult>;

export const HTTP = 'http://';
export const HTTPS = 'https://';
