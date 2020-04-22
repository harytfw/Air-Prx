

import CodeMirror from 'codemirror'
import "codemirror/lib/codemirror.css";
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldgutter';


import * as types from '../types';
import { debugLog } from '../log';
import { synchronizeGroup } from '../util';
import { SchemeItem, rootScheme } from './scheme';


// import page from './options.vue';

const editor = CodeMirror(document.body.querySelector('#editor')! as HTMLDivElement, {
    mode: { name: "javascript", json: true },
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: { "Ctrl-Q": function (cm: any) { cm.foldCode(cm.getCursor()); } },
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
});

// const vm = new Vue({
//     render: (h) => {
//         console.log(h);
//         return h(page)
//     }
// }).$mount('#app');

const $ = document.querySelector.bind(document);

async function getConfig() {
    const storage = await browser.storage.local.get()
    return storage;
}

async function setConfig(config) {
    return browser.storage.local.set(config);
}

async function load() {
    const json = JSON.stringify(await getConfig(), null, 2);
    editor.setValue(json);
    debugLog('load config');
}

async function synchronize() {
    const config = JSON.parse(editor.getValue());
    if (!Array.isArray(config.groups)) {
        return;
    }
    debugLog('before synchronize', JSON.parse(JSON.stringify(config)));
    for (const plainGroup of config.groups) {
        await synchronizeGroup(plainGroup);
    }
    editor.setValue(JSON.stringify(config, null, 2));
    debugLog('after synchronize', JSON.stringify(config));
}

async function validate() {
    let err;
    try {
        const obj = JSON.parse(editor.getValue());
        addMissingProperty(obj);
        const json = JSON.stringify(obj, null, 2);
        editor.setValue(json);
    } catch (ex) {
        console.error(ex);
        err = ex.toString();
    }
    showErrorMsg(err);
}

function save() {
    setConfig(JSON.parse(editor.getValue()));
    debugLog('save');
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

function showErrorMsg(err) {
    const e = document.querySelector('#error') as HTMLElement;
    if (!err) {
        e.style.display = 'none';
    } else {
        e.style.display = 'block';
        e.textContent = err;
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
        if (!hasProp(g, 'order')) {
            g.order = 0;
        }
    }
}


async function buildSchemeTree() {
    function buildDetail(field: SchemeItem, summary: string, ...children: HTMLElement[]) {
        const d = document.createElement("details");
        const s = document.createElement("summary");
        s.textContent = summary;
        d.dataset['name'] = field.name;
        d.appendChild(s);
        for (const c of children) {
            d.appendChild(c);
        }
        return d;
    }

    function buildOptions(field: SchemeItem, value?: string) {
        const select = document.createElement("select");
        for (const optVal of field.data) {
            const option = document.createElement("option");
            option.value = optVal;
            option.textContent = optVal;
            select.appendChild(option);
        }
        if (value) select.value = value;
        return select;
    }

    function addElement(event: Event) {
        const button = event.target as HTMLButtonElement;
        helper(JSON.parse(button.dataset['scheme']!) as SchemeItem, button.parentElement!, null);
    }

    function buildAddButton(SchemeItem: SchemeItem) {
        const button = document.createElement('button');
        button.textContent = '+';
        button.dataset['scheme'] = JSON.stringify(SchemeItem);
        button.addEventListener('click', addElement);
        return button;
    }

    function getArraySize(parent: HTMLElement) {
        let _size = parent.dataset['size'];
        let size = parseInt(_size ? _size : '0');
        return size;
    }

    function updateArraySize(parent: HTMLElement, delta: number) {
        const size = getArraySize(parent);
        parent.dataset['size'] = `${size + delta}`;
    }

    function setArraySize(parent: HTMLElement, size: number) {
        parent.dataset['size'] = `${size}`
    }

    function helper(top: SchemeItem, parent: HTMLElement, value: any) {
        if (value === undefined) {
            value = null;
        }
        console.log(top.name, value);
        if (top.type === 'boolean') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            parent.appendChild(checkbox);
        }
        else if (top.type === 'options') {
            parent.appendChild(buildOptions(top));
        }
        else if (top.type === 'string' || top.type === 'number') {
            const label = document.createElement('label');
            label.textContent = top.name;
            const input = document.createElement('input');
            input.type = ''
            if (value) {
                input.value = value[top.name];
            } else {
                input.value = top.default ? top.default : '';
            }
            parent.appendChild(label);
            parent.appendChild(input);
        }
        else if (top.type === 'array_string') {
            const size = getArraySize(parent);
            if (size === 0) {
                parent.appendChild(buildAddButton(top));
            }
            if (value === null) {
                const li = document.createElement('li');
                const input = document.createElement('input');
                li.appendChild(input)
                updateArraySize(parent, +1);
                parent.appendChild(li);
            } else {
                for (const str of value[top.name]) {
                    const li = document.createElement('li');
                    const input = document.createElement('input');
                    input.value = str;
                    li.appendChild(input)
                    updateArraySize(parent, +1);
                    parent.appendChild(li);
                }
            }
        } else if (top.type === 'array_object') {
            let size = getArraySize(parent);
            if (size === 0) {
                parent.appendChild(buildAddButton(top));
            }
            if (value === null) {
                const wrapper = buildDetail(top, `${size}`);
                for (const field of top.fields!) {
                    const details = buildDetail(top, field.name);
                    helper(field, details, null);
                    wrapper.appendChild(details)
                }
                updateArraySize(parent, +1);
                parent.appendChild(wrapper);
            } else {
                for (const element of value[top.name]) {
                    console.log('element', element);
                    const wrapper = buildDetail(top, `${size}`);
                    for (const field of top.fields!) {
                        const details = buildDetail(top, field.name);
                        helper(field, details, element);
                        wrapper.appendChild(details);
                    }
                    size += 1;
                    parent.appendChild(wrapper);
                }
                setArraySize(parent, size);
            }
        } else if (top.type === 'object') {
            for (const field of top.fields!) {
                const details = buildDetail(top, field.name);
                if (value === null) {
                    helper(field, details, null);
                } else {
                    helper(field, details, value[top.name]);
                }
                parent.appendChild(details);
            }
        }
    }
    const container = document.createElement('details');
    console.log(rootScheme, container);
    helper(rootScheme, container, { _root_: await getConfig() });
    document.body.appendChild(container);
}
(window as any).buildSchemeTree = buildSchemeTree;
$('#load-btn')?.addEventListener('click', load);
$('#validate-btn')?.addEventListener('click', validate);
$('#export-btn')?.addEventListener('click', exportFn);
$('#save-btn')?.addEventListener('click', save);
$('#syn-btn')?.addEventListener('click', synchronize);