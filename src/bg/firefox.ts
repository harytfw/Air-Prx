
import 'webextension-polyfill/dist/browser-polyfill.js';
import Core, { buildCore } from './core';
import { debugLog } from '../util';
import * as types from '../types';

let core: Core | null = null;

async function init() {

    const config: types.Configuration = (await browser.storage.local.get()) as any;

    if (!Array.isArray(config.groups)) {
        debugLog('no groups in configuration')
        core = null;
        return;
    }
    try {
        core = await buildCore(config);
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
    debugLog(requestInfo.requestId, 'start');
    const p = core.getProxy(requestInfo);
    return p.then((proxy) => {
        debugLog(requestInfo.requestId, 'end', performance.now() - start, 'ms');
        return proxy;
    }).catch(reason => {
        console.error(reason);
    });
}


export function init_firefox() {
    console.log('init firefox');
    browser.proxy.onError.addListener(error => {
        console.error(`Proxy error: ${error.message}`);
    });

    browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });

    browser.storage.onChanged.addListener((changes, areaName) => {
        init()
    });

    browser.runtime.onMessage.addListener((msg: types.ExtEventMessage, _, sendResponse) => {
        if (msg.name === 'getCache') {
            console.log(msg.name);
            if (core) {
                sendResponse(core.cache.entries());
            } else {
                sendResponse([]);
            }
        }
    })

    init();
}