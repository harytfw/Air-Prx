import * as types from '../types';

export class BaseRuleGroup {
    private _id: string;
    proxyInfo: types.ProxyInfo;
    name: string;

    subSource: string;
    subType: string;

    constructor(name: string, proxyInfo: types.ProxyInfo) {
        this._id = `${Math.random()}`; // internal id;
        this.name = name;
        this.subType = "";
        this.subSource = "";
        this.proxyInfo = proxyInfo;
    }

    get id() {
        return this._id;
    } 

    getProxyResult(summary: types.RequestSummary): types.ProxyResult {
        throw new Error('TODO');
    }
}