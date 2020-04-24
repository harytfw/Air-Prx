
import 'webextension-polyfill/dist/browser-polyfill.js';
import Core from './core';
import ruleLoader from '../rule-loader';
import { debugLog } from '../util';
import * as types from '../types';

let core: Core | null = null;

async function init() {
    core = new Core();
    (window as any).core = core;
    (window as any).ruleLoader = ruleLoader;

    const config: types.Configuration = (await browser.storage.local.get()) as any;

    if (!Array.isArray(config.groups)) {
        debugLog('no groups in configuration')
        return;
    }

    core.fromConfig(config);

    core.sortAll();
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

    init();
}