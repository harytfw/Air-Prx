export interface ProxyInfo {
    type: string,
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

export interface GroupConfig {
    name: string,
    proxyInfo: ProxyInfo,
    rules: string[],
    subSource?: string,
    subType?: string,
    matchType?: 'documentUrl' | 'ipAddress' | 'standard' | 'hostName' | 'void',
    enable?: boolean,
    order?: number,
}

export interface Configuration {
    groups: GroupConfig[],
    features: string[]
}

export interface RequestSummary {
    url: string,
    hostName: string,
    protocol: string,
    documentUrl?: string,
    documentHostName: string,
    ipAddress?: string,
}

export type Cache = Map<string, ProxyResult>;


export const HTTP = 'http://';
export const HTTPS = 'https://';
