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

export interface PlainGroupObject {
    name: string,
    proxyInfo: ProxyInfo,
    internalRules: string[],
    subSource: string,
    subType: string,
    useDocumentUrl: boolean,
    useIpAddress: boolean,
}

export interface Configuration {
    groups: PlainGroupObject[],
    features: string[]
}

export interface RequestSummary {
    url: string,
    hostName: string,
    protocol: string,
    ipAddress?: string,
}

export type Cache = Map<string, ProxyResult>;


export const HTTP = 'http://';
export const HTTPS = 'https://';
