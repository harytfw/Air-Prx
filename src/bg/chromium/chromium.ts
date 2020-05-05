
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import * as types from '../../types';
import { debugLog } from "../../util";
import { ChromiumProxyCore as ChromiumProxy } from './chromium-proxy';



export function init_chromium() {
    console.log('init chromium');
    let proxy = new ChromiumProxy();
    browser.storage.onChanged.addListener((changes, areaName) => {
        proxy.reloadConfig();
    });
    browser.runtime.onMessage.addListener((msg: types.ExtEventMessage, _, sendResponse) => {
        console.log(msg);
        switch (msg.name) {
            case 'clearCache': {
                proxy.reloadConfig()
                debugLog('clear cache done');
                break;
            }
            case 'setProxyState': {
                if (Boolean(msg.data)) {
                    proxy.enableProxy();
                } else {
                    proxy.disableProxy();
                }
                break;
            }
            case 'getProxyState': {
                sendResponse(proxy.isEnable);
                break;
            }
            case 'updateMyIp': {
                proxy.updateMyIp();
                break;
            }
            case 'getCache': {
                sendResponse([]);
                break;
            }

        }
        proxy.reloadConfig();
    })
}