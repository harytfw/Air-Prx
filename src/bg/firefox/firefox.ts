
import 'webextension-polyfill/dist/browser-polyfill.js';
import { Core, buildCore } from './core';
import { Cache } from '../../proxy-cache';
import { debugLog, } from '../../util';
import * as types from '../../types';

let core: Core | null = null;

async function init() {
    const config: types.Configuration = (await browser.storage.local.get()) as any;

    if (!Array.isArray(config.groups)) {
        debugLog('no groups in configuration')
        core = null;
        return;
    }
    try {
        if (core) core.destory();
        core = await buildCore(config);
        (window as any).core = core;
    } catch (ex) {
        console.error(ex);
        core = null;
    }
}

function handleProxyRequest(requestInfo) {
    if (core === null) {
        debugLog('core is not prepared');
        return { type: 'direct' };
    }
    const start = performance.now();
    debugLog(requestInfo.requestId, 'start', requestInfo.url);
    const p = core.getProxy(requestInfo);
    return p.then((proxy) => {
        debugLog(requestInfo.requestId, 'end', performance.now() - start, 'ms');
        return proxy;
    }).catch(reason => {
        console.error(reason);
    });
}

function objectifyCache(map: Map<any, Cache<any, any>>): object {
    const obj = {}
    for (const key of map.keys()) {
        obj[key.toString()] = map.get(key)!.entries();
    }
    return obj;
}

function handleEvent(msg: types.ExtEventMessage, sendResponse) {
    console.log(msg);
    switch (msg.name) {
        case 'getCache': {
            if (core) {
                sendResponse(objectifyCache(core.caches));
            } else {
                sendResponse({});
            }
            break;
        }
        case 'clearCache': {
            if (core) {
                for (const cache of core.caches.values()) {
                    cache.clear();
                }
                debugLog('clear cache done');
            }
            break;
        }
        case 'updateMyIp': {
            if (core) {
                core.updateMyIP();
            }
            break;
        }
        case 'setProxyState': {
            if (core) {
                core.tempDisable = !Boolean(msg.data);
            }
            break;
        }
        case 'getProxyState': {
            if(core) {
                sendResponse(!core.tempDisable);
            }
        }
    }
}

export function init_firefox() {
    console.log('init firefox');
    browser.proxy.onError.addListener(error => {
        console.error(`Proxy error: ${error}`);
    });

    browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });

    browser.storage.onChanged.addListener((changes, areaName) => {
        init()
    });

    browser.runtime.onMessage.addListener((msg: types.ExtEventMessage, _, sendResponse) => {
        handleEvent(msg, sendResponse);
    });

    init();
}