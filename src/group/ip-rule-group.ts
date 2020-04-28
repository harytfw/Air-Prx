import * as types from '../types';
import { BaseRuleGroup } from './base-rule-group';
import { ipToInt32, debugLog, toCIDR } from '../util';
export class IpRuleGroup extends BaseRuleGroup {

    ipMask: types.CIDR[];
    constructor(name: string, proxyInfo: types.ProxyInfo, ipList: string[]) {
        super(name, proxyInfo);
        this.ipMask = [];
        for (const ip of ipList) {
            this.addIpAddress(ip);
        }
    }

    addIpAddress(strCidr: string) {
        const cidr = toCIDR(strCidr);
        //debugLog('addIpAddress', strCidr)
        this.ipMask.push(cidr);
    }

    getProxyResult(summary: types.RequestSummary) {
        const int32Ip = ipToInt32(summary.ipAddress!);
        for (const mask of this.ipMask) {
            if ((mask[1] & int32Ip) === mask[0]) {
                return types.ProxyResult.proxy;
            }
        }
        return types.ProxyResult.continue;
    }
}

