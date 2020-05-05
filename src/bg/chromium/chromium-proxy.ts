
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import * as types from '../../types';
import { debugLog, getMyIp } from "../../util";



declare const chrome;

const CONFIG_REPLACE_MARKER = `"CONFIG_REPLACE_MARKER"`;

async function generatePAC(config) {
    const fileURL = chrome.runtime.getURL('./pac/pac.js');
    let js = await fetch(fileURL).then(a => a.text());
    js = js.replace(CONFIG_REPLACE_MARKER, JSON.stringify(config));
    console.log(js);
    return js;
}

const ALWAYS_DIRECT_PAC = `function FindProxyForURL() { return 'DIRECT';}`;


export class ChromiumProxyCore {

    private enableFlag: boolean
    constructor() {
        this.enableFlag = true;
    }

    get isEnable() {
        return this.enableFlag;        
    }

    enableProxy() {
        this.reloadConfig();
        this.enableFlag = true;
    }

    disableProxy() {
        this.configurePAC(ALWAYS_DIRECT_PAC);
        this.enableFlag = false;
    }


    onProxyError(err) {
        console.error(err);
    }

    configurePAC(js: string) {
        chrome.proxy.settings.set({
            value: {
                mode: "pac_script",
                pacScript: {
                    data: js,
                }
            }, scope: 'regular'
        }, function (...args) {
            console.log(...args)
        });
    }

    async reloadConfig() {
        const config = await browser.storage.local.get();
        const pac = await generatePAC(config);
        this.configurePAC(pac);
    }

    async updateMyIp() {
        const config = await browser.storage.local.get() as types.Configuration;
        config.myIp = await getMyIp();
        const pac = await generatePAC(config);
        this.configurePAC(pac);
    }
}