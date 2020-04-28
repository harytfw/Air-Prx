

import CodeMirror from 'codemirror'
import "codemirror/lib/codemirror.css";
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldgutter';

import browser from 'webextension-polyfill/dist/browser-polyfill.js';
import * as types from '../types';
import { debugLog, buildCookieStoreIdMap, enableDebugLog } from '../util';
import { syncGroup, syncConfig } from '../syncUtil';

const editor = CodeMirror(document.body.querySelector('#editor')! as HTMLDivElement, {
    mode: { name: "javascript", json: true },
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: { "Ctrl-Q": function (cm: any) { cm.foldCode(cm.getCursor()); } },
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
});


editor.on('change', () => {
    console.log(editor.getCursor());
    const lineCount = editor.lineCount();
    for (let n = 0; n < lineCount; n++) {
        const line = editor.getLine(n);
        if (line.includes("rules")) {
            (editor as any).foldCode({ line: n, ch: 0 })
        }
    }
    updateButtons(false);
})

const $ = document.querySelector.bind(document);

async function getConfig(sync = false) {
    if (sync) {
        return browser.storage.sync.get();
    }
    return browser.storage.local.get()
}


async function setConfig(config: types.Configuration, sync = false) {
    if (sync) {
        const cloned = JSON.parse(JSON.stringify(config)) as types.Configuration;
        const groups = cloned.groups;
        for (const g of groups) {
            g.rules = [];
        }
        return browser.storage.sync.set(cloned);
    } else {
        return browser.storage.local.set(config);
    }
}

async function loadSync() {
    editor.setValue(JSON.stringify(await getConfig()));
}

async function saveSync() {
    await setConfig(JSON.parse(editor.getValue()), true);
    showMsg('save to sync storage done', 5000)
}

async function load() {
    const json = JSON.stringify(await getConfig(), null, 2);
    editor.setValue(json);
    debugLog('load config');
}

function save() {
    setConfig(JSON.parse(editor.getValue()));
    showMsg('save to storage done', 5000);
}

async function onSync() {
    const config = JSON.parse(editor.getValue());
    if (!Array.isArray(config.groups)) {
        return;
    }
    debugLog('before synchronize', JSON.parse(JSON.stringify(config)));
    let err = '';
    for (const plainGroup of config.groups) {
        try {
            await syncGroup(plainGroup);
        }
        catch (ex) {
            err += `Can not synchronize group "${plainGroup.name}" : ${ex}\n`;
        }
    }
    if (err !== '') {
        showMsg(err);
    } else {
        showMsg('synchronize subscription done', 5000);
    }
    editor.setValue(JSON.stringify(config, null, 2));
    debugLog('after synchronize', config);
}


async function onSyncConfig() {
    const cloned = JSON.parse(editor.getValue()) as types.Configuration;
    await syncConfig(cloned);
    editor.setValue(JSON.stringify(cloned));
}


function exportFn() {
    function pad(num: number) {
        return `${num}`.padStart(2, '0');
    }
    const download = document.querySelector("#file-download") as HTMLAnchorElement;
    const date = new Date();
    download.download = `fastpac.${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDay())}-${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
    const url = window.URL.createObjectURL(new Blob([editor.getValue()], {
        type: 'text/plain'
    }));
    download.href = url;
    download.click();
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 60 * 1000);
}

async function validate() {
    let err;
    try {
        const obj = JSON.parse(editor.getValue()) as types.Configuration;
        addMissingProperty(obj as any);
        const json = JSON.stringify(obj, null, 2);
        editor.setValue(json);
    } catch (ex) {
        console.error(ex);
        err = ex.toString();
    }
    if (!err) {
        updateButtons(true);
    } else {
        updateButtons(false);
    }
    showMsg(err);
}

function updateButtons(b: boolean) {
    function disable(s: string) {
        ($(s) as HTMLButtonElement).disabled = true;
    }
    function enable(s: string) {
        ($(s) as HTMLButtonElement).disabled = false;
    }
    const selectors = ['#save-btn', '#save-sync-btn'];
    if (b) {
        selectors.forEach(enable);
    } else {
        selectors.forEach(disable);
    }
}


function showMsg(msg, timeout = 0) {
    const e = document.querySelector('#error') as HTMLElement;
    if (!msg) {
        e.style.display = 'none';
    } else {
        e.innerText = msg;
        e.style.display = 'block';
    }
    if (timeout > 0) {
        setTimeout(() => {
            e.style.display = 'none';
        }, timeout)
    }
}

function addMissingProperty(config: { features?: [], groups?: types.GroupConfig[] }) {

    function hasProp<T>(obj: T, name: keyof T) {
        return name in obj;
    }

    if (!hasProp(config, 'features')) {
        config.features = [];
    }
    if (!hasProp(config, 'groups')) {
        config.groups = [];
    }
    for (const g of config.groups!) {
        if (!hasProp(g, 'name')) {
            g.name = '';
        }
        if (!hasProp(g, 'proxyInfo')) {
            g.proxyInfo = { type: 'direct' };
        }
        if (!hasProp(g, 'enable')) {
            g.enable = true;
        }
        if (!hasProp(g, 'matchType')) {
            g.matchType = 'void';
        }
    }
}

async function showContainer() {
    const cookieStoreIdMap = await buildCookieStoreIdMap();
    const msg = Array.from(cookieStoreIdMap.keys()).join("\n");
    showMsg(msg);
}


function init() {
    enableDebugLog();

    window.onunhandledrejection = (ex) => {
        showMsg(JSON.stringify(ex));
    }

    window.onerror = (err) => {
        showMsg(err);
    }

    $('#load-btn')?.addEventListener('click', load);
    $('#validate-btn')?.addEventListener('click', validate);
    $('#export-btn')?.addEventListener('click', exportFn);
    $('#save-btn')?.addEventListener('click', save);
    $('#save-sync-syn')?.addEventListener('click', saveSync);
    $('#load-sync-syn')?.addEventListener('click', loadSync);
    $('#sync-btn')?.addEventListener('click', onSync);
    $('#sync-config-btn')?.addEventListener('click', onSyncConfig);
    $('#show-container-btn')?.addEventListener('click', showContainer);
    updateButtons(false);
}
init();