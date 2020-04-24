
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import * as types from '../types';
import { debugLog } from '../util';

async function proxyDocumentUrl(url: string) {
    const config: types.Configuration = await browser.storage.local.get();
    let documentUrlGroup = config.groups.find(a => a.matchType === 'document_url');
    if (!documentUrlGroup) {
        debugLog('generate document_url group')
        documentUrlGroup = {
            name: 'AUTO GENERATED',
            enable: true,
            matchType: 'document_url',
            proxyInfo: {
                type: 'direct'
            }
        }
        config.groups.push(documentUrlGroup);
    }
    debugLog('add url', url);
    if (Array.isArray(documentUrlGroup.rules)) {
        documentUrlGroup.rules.push(url);
    } else {
        documentUrlGroup.rules = [url];
    }
    browser.storage.local.set(config);
}