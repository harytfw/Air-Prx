import * as types from "./types";

import stringify from 'stringify-object';

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


export function ipToInt32(ip: string): number {
    let ipArr = ip.split('.').map(a => parseInt(a));
    let int32 = ipArr[0] << 24 | ipArr[1] << 16 | ipArr[2] << 8 | ipArr[3];
    return int32;
}

export function toCIDR(strCidr: string): types.CIDR {
    let int32Ip = ipToInt32(strCidr.substring(0, strCidr.lastIndexOf('/')));
    const maskLen = parseInt(strCidr.substring(strCidr.lastIndexOf('/') + 1));
    let mask = 0;
    for (let i = 31, len = maskLen; i >= 0 && len > 0; i--, len--) {
        mask = 1 << i | mask;
    }

    return [int32Ip, mask];
}

export function isCidrMatch(cidr: types.CIDR, ip: number) {
    return (ip & cidr[1]) === cidr[0];
}

export function enableDebugLog() {
    (globalThis as any).debug = true;
}

export function disableDebugLog() {
    (globalThis as any).debug = false;
}

export function debugLog(...args) {
    if (typeof window === 'object' && (window as any).debug === true) {
        console.debug(...args);
    }
    if (typeof window === 'undefined') { // PAC
        if(args.length === 1) {
            alert(stringify(args[0]));
        } else {
            alert(stringify(args))
        }
    }
}


export function isPAC() {
    return !window;
}