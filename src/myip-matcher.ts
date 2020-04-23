import { ipToInt32, isCidrMatch, debugLog, toCIDR } from "./util";
import * as types from './types';
export class MyIpMatcher {

    myIp: number;
    myIpList: types.CIDR[];

    constructor(myIpList: string[], myIp?: number) {
        this.myIp = myIp ? myIp : 0;
        this.myIpList = myIpList.map(toCIDR);
    }

    isAllow() {
        for (const cidr of this.myIpList) {
            if (isCidrMatch(cidr, this.myIp)) {
                return true;
            }
        }
        return false;
    }

    async updateMyIp() {
        const strIp = await this.getMyIp();
        this.myIp = ipToInt32(strIp);
        debugLog("my ip:", this.myIp);
    }

    async getMyIp(): Promise<string> {
        return fetch('http://ip-api.com/json/').then(a => a.json()).then(data => {
            debugLog('query ip info', data);
            return Promise.resolve(data.query)
        })
    }
}