import { BaseRuleGroup } from "./base-rule-group";
import * as types from '../types';
export class DocumentHostnameGroup extends BaseRuleGroup {

    rules: string[];

    constructor(name: string, proxyInfo: types.ProxyInfo, rules: string[]) {
        super(name, proxyInfo);
        this.rules = rules;
    }

    getProxyResult(summary: types.RequestSummary) {
        if (summary.documentHostName && this.rules.includes(summary.documentHostName)) {
            return types.ProxyResult.proxy;
        }
        return types.ProxyResult.continue;
    }
}