import * as types from "./types";
import ruleLoader from "./rule-loader";
import { debugLog } from "./log";

export function lowerBound(array: string[], start: number, end: number, i: number, target: string, j: number) {
    if (start >= end) {
        return -1;
    }
    while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        if (array[mid].charAt(i) > target.charAt(j)) {
            end = mid - 1;
        } else {
            start += 1;
        }
    }
    return start;
}

export function upperBound(array: string[], start: number, end: number, i: number, target: string, j: number) {
    if (start >= end) {
        return -1;
    }
    while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        if (array[mid].charAt(i) <= target.charAt(j)) {
            end -= 1;
        } else {
            start = mid + 1;
        }
    }
    return end;
}

export function extractDomainAndProtocol(url: string) {
    let domainName: string;
    let slashIndex = url.indexOf('//');
    let lastSlashIndex = url.indexOf('/', slashIndex + 2);

    if (lastSlashIndex >= 0) {
        // console.log('slashIndex:', slashIndex);
        domainName = url.substring(slashIndex + 2, lastSlashIndex);
    } else {
        domainName = url.substring(slashIndex + 2, url.length);
    }

    const protocol = url.substring(0, slashIndex + 2);
    return [domainName, protocol];
}

export async function synchronizeGroup(group: types.PlainGroupObject) {
    let rules: string[] = [];
    switch (group.subType) {
        case 'embeded-gfw':
            rules = await ruleLoader.loadEmbededGFW();
            group.internalRules = rules;
            debugLog('update subscription by ', group.subType);
            break;
        default:
            debugLog('do not support this subscription type');
            break;
    }
}

export function ipToInt32(ip: string) {
    let ipArr = ip.split('.').map(a => parseInt(a));
    let int32 = ipArr[0] << 24 | ipArr[1] << 16 | ipArr[2] << 8 | ipArr[3];
    return int32;
}
