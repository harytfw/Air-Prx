
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import { debugLog } from "../util";
declare const chrome;

async function generatePAC(config) {

    const fileURL = chrome.runtime.getURL('./pac/pac.js');
    let js = await fetch(fileURL).then(a => a.text());

    const MARKER_START = '//START_REPLACE';
    const MARKER_END = '//END_REPLACE';
    js =
        js.substring(0, js.indexOf(MARKER_START))
        + `\n;let config = ${JSON.stringify(config)};\n`
        + js.substring(js.indexOf(MARKER_END) + MARKER_END.length);

    return js;
}

async function init() {
    const config = await browser.storage.local.get();
    console.log(config);
    const pac = await generatePAC(config);
    const settingConfig = {
        mode: "pac_script",
        pacScript: {
            data: pac,
        }
    };
    chrome.proxy.onProxyError.addListener(err => {
        console.error(err);
    });
    debugLog('set PAC');
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
    init();
}