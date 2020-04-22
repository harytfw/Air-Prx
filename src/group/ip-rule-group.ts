import * as types from '../types';
import { BaseRuleGroup } from './base-rule-group';
import { debugLog } from '../log';
import { ipToInt32 } from '../util';
export class IpRuleGroup extends BaseRuleGroup {

    internalIpAddress: string[];
    ipMask: number[][];
    constructor(name: string, proxyInfo: types.ProxyInfo, ipList: string[]) {
        super(name, proxyInfo);
        this.internalIpAddress = [];
        this.ipMask = [];
        for (const ip of ipList) {
            this.addIpAddress(ip);
        }
    }

    addIpAddress(ipAddrWithMask: string) {
        let int32Ip = ipToInt32(ipAddrWithMask.substring(0, ipAddrWithMask.lastIndexOf('/')));
        const maskLen = parseInt(ipAddrWithMask.substring(ipAddrWithMask.lastIndexOf('/') + 1));
        let mask = 0;
        for (let i = 31, len = maskLen; i >= 0 && len > 0; i--, len--) {
            mask = 1 << i | mask;
        }
        debugLog('addIpAddress', ipAddrWithMask, int32Ip, maskLen, mask)
        this.ipMask.push([int32Ip, mask]);
    }

    getProxyResult(summary: types.RequestSummary) {
        if (!summary.ipAddress) {
            throw new Error('require ip address');
        }
        const int32Ip = ipToInt32(summary.ipAddress);
        for (const mask of this.ipMask) {
            if ((mask[1] & int32Ip) === mask[0]) {
                return types.ProxyResult.proxy;
            }
        }
        return types.ProxyResult.continue;
    }
}

