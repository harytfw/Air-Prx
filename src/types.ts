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
export type MatchType = 'document_url' | 'ip' | 'std' | 'hostname' | 'void';

export interface GroupConfig {
    name: string,
    proxyInfo: ProxyInfo,
    rules?: string[],
    subSource?: string,
    subType?: SubType,
    matchType?: MatchType,
    enable: boolean,
    order?: number,
}

export type Feature = 'use_cache' | 'ipv6' | 'log' | 'debug';

export interface Configuration {
    groups: GroupConfig[],
    features: Feature[]
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
