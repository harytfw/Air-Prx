import { BaseRuleGroup } from "./base-rule-group";
import * as types from '../types';

export class ContainerGroup extends BaseRuleGroup {
    cookieStoreIds: string[];
    constructor(name: string, proxyInfo: types.ProxyInfo, cookieStoreId: string[]) {
        super(name, proxyInfo);
        this.cookieStoreIds = cookieStoreId;
    }

    getProxyResult(summary: types.RequestSummary): types.ProxyResult {
        if (typeof summary.cookieStoreId === 'undefined') {
            return types.ProxyResult.continue;
        }
        
        if (this.cookieStoreIds.includes(summary.cookieStoreId)) {
            return types.ProxyResult.proxy;
        }

        return types.ProxyResult.continue;
    }
}