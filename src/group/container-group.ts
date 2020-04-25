import { BaseRuleGroup } from "./base-rule-group";
import * as types from '../types';

export class ContainerGroup extends BaseRuleGroup {
    cookieStoreId: string;
    constructor(name: string, proxyInfo: types.ProxyInfo, cookieStoreId: string) {
        super(name, proxyInfo);
        this.cookieStoreId = cookieStoreId;
    }

    getProxyResult(summary: types.RequestSummary): types.ProxyResult {
        if (typeof summary.cookieStoreId === 'undefined') {
            return types.ProxyResult.continue;
        }
        
        if (summary.cookieStoreId === this.cookieStoreId) {
            return types.ProxyResult.proxy;
        }

        return types.ProxyResult.continue;
    }
}