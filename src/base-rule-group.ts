import * as types from './types';

export class BaseRuleGroup {
    proxyCache: types.Cache;
    useCache: boolean;

    proxyInfo: any;
    name: string;

    subSource: string;
    subType: string;
;

    constructor(name: string, proxyInfo: types.ProxyInfo) {
        this.name = name;
        this.subType = "";
        this.subSource = "";
        this.proxyCache = new Map();
        this.useCache = true;
        this.proxyInfo = proxyInfo;
    }

    getProxyResult(summary: types.RequestSummary): types.ProxyResult {
        throw new Error('TODO');
    }
}