
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import * as types from '../types';
import { debugLog } from '../util';

async function proxyDocumentUrl(url: string) {
    const config: types.Configuration = await browser.storage.local.get();
    let hostnamelGroup = config.groups.find(a => a.matchType === 'hostname');
    if (!hostnamelGroup) {
        debugLog('generate document_url group')
        hostnamelGroup = {
            name: 'AUTO GENERATED',
            enable: true,
            matchType: 'hostname',
            proxyInfo: {
                type: 'direct'
            }
        }
        config.groups.push(hostnamelGroup);
    }
    debugLog('add url', url);
    if (Array.isArray(hostnamelGroup.rules)) {
        hostnamelGroup.rules.push(url);
    } else {
        hostnamelGroup.rules = [url];
    }
    browser.storage.local.set(config);
}