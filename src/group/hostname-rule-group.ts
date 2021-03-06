import { BaseRuleGroup } from "./base-rule-group";
import * as types from '../types';
export class HostnameRuleGroup extends BaseRuleGroup {

    rules: string[];

    constructor(name: string, proxyInfo: types.ProxyInfo, rules: string[]) {
        super(name, proxyInfo);
        this.rules = rules;
    }

    getProxyResult(summary: types.RequestSummary) {
        if (summary.hostName && this.rules.includes(summary.hostName)) {
            return types.ProxyResult.proxy;
        }
        return types.ProxyResult.continue;
    }
}