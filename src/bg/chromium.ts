
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import * as types from '../types';
import { debugLog } from "../util";

declare const chrome;

async function generatePAC(config) {

    const fileURL = chrome.runtime.getURL('./pac/pac.js');
    let js = await fetch(fileURL).then(a => a.text());
    js = js.replace(`"TO_REPLACE"`, JSON.stringify(config));
    console.log(js);
    return js;

}

function onProxyError(err) {
    console.error(err);
}

async function init() {
    const config = await browser.storage.local.get();
    const pac = await generatePAC(config);
    const settingConfig = {
        mode: "pac_script",
        pacScript: {
            data: pac,
        }
    };
    chrome.proxy.onProxyError.removeListener(onProxyError);
    chrome.proxy.onProxyError.addListener(onProxyError);
    debugLog('configure proxy setting');
    chrome.proxy.settings.set(
        { value: settingConfig, scope: 'regular' },
        function (...args) {
            console.log(...args)
        }
    );

}

export function init_chromium() {
    console.log('init chromium');
    browser.storage.onChanged.addListener((changes, areaName) => {
        init()
    });
    browser.runtime.onMessage.addListener((msg: types.ExtEventMessage, _, sendResponse) => {
        console.log(msg);
        if (msg.name === 'clearCache') {
            init();
            debugLog('clear cache done');
        }
    });
    init();
}