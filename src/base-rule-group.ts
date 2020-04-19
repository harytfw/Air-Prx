import * as types from './types';

export class BaseRuleGroup {
    proxyCache: types.Cache;
    useCache: boolean;

    proxyInfo: any;
    name: string;

    subSource: string;
    subType: string;
    useDocumentUrl: boolean;
    useIpAddress: boolean;

    constructor(name: string, proxyInfo: types.ProxyInfo) {
        this.name = name;
        this.subType = "";
        this.subSource = "";
        this.proxyCache = new Map();
        this.useCache = true;
        this.useDocumentUrl = false;
        this.useIpAddress = false;
        this.proxyInfo = proxyInfo;
    }

    getProxyResult(summary: types.RequestSummary): Promise<types.ProxyResult> {
        throw new Error('TODO');
    }

}