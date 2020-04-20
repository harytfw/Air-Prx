import { BaseRuleGroup } from "./base-rule-group";
import * as types from "./types";
export class VoidRuleGroup extends BaseRuleGroup {
    constructor(name: string, proxyInfo: types.ProxyInfo) {
        super(name, proxyInfo);
    }

    getProxyResult() {
        return this.proxyInfo;
    }
    
}