import { BaseRuleGroup } from "./base-rule-group";
import * as types from '../types';
export class HostNameRuleGroup extends BaseRuleGroup {

    rules: string[];

    constructor(name: string, proxyInfo: types.ProxyInfo) {
        super(name, proxyInfo);
        this.rules = [];
    }

    addSiteHostName(hostName: string) {
        if (this.rules.includes(hostName)) {
            return;
        }
        this.rules.push(hostName);
    }

    removeSiteHostName(hostName: string) {
        this.rules.filter(item => item !== hostName);
    }

    hasSiteHostName(hostName: string) {
        this.rules.includes(hostName);
    }

    getProxyResult(summary: types.RequestSummary) {
        if (this.rules.includes(summary.documentHostName)) {
            return types.ProxyResult.proxy;
        }
        return types.ProxyResult.continue;
    }
}