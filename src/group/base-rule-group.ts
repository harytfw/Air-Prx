import * as types from '../types';

export class BaseRuleGroup {
    proxyInfo: any;
    name: string;

    subSource: string;
    subType: string;

    constructor(name: string, proxyInfo: types.ProxyInfo) {
        this.name = name;
        this.subType = "";
        this.subSource = "";
        this.proxyInfo = proxyInfo;
    }

    getProxyResult(summary: types.RequestSummary): types.ProxyResult {
        throw new Error('TODO');
    }
}