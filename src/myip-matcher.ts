import { ipToInt32, isCIDRMatch, debugLog, toCIDR, isPAC, getMyIp } from "./util";
import * as types from './types';
export class MyIpMatcher {

    myIp: number;
    myIpList: types.CIDR[];

    constructor() {
        this.myIp = 0;
        this.myIpList = [];
    }

    isAllow() {
        if (this.myIp === 0) {
            return true;
        }
        for (const cidr of this.myIpList) {
            if (isCIDRMatch(cidr, this.myIp)) {
                return true;
            }
        }
        return false;
    }

    addIp(ip: string) {
        this.myIpList.push(toCIDR(ip));
    }

    setMyIpList(myIpList: types.CIDR[]) {
        this.myIpList = myIpList;
    }

    setMyIp(myIp: number) {
        this.myIp = myIp;
    }

    async updateMyIp() {
        if(isPAC()) {
            debugLog('can not update my ip under PAC mode');
            return;
        }
        debugLog('start update my ip');
        const strIp = await getMyIp();
        this.myIp = ipToInt32(strIp);
        debugLog("my ip:", this.myIp);
    }

}