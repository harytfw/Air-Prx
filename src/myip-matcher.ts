import { ipToInt32, isCidrMatch, debugLog, toCIDR } from "./util";
import * as types from './types';
export class MyIpMatcher {

    myIp: number;
    myIpList: types.CIDR[];

    constructor(myIpList: string[], myIp: number) {
        this.myIp = myIp ? myIp : 0;
        this.myIpList = myIpList.map(toCIDR);
    }

    isAllow() {
        if (this.myIp === 0) {
            return true;
        }
        for (const cidr of this.myIpList) {
            if (isCidrMatch(cidr, this.myIp)) {
                return true;
            }
        }
        return false;
    }

    setMyIpList(myIpList:types.CIDR[]) {
        this.myIpList = myIpList;
    }

    setMyIp(myIp:number) {
        this.myIp = myIp;
    }

    async updateMyIp() {
        debugLog('start update my ip');
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