import * as types from '../types';
import { isFirefox } from '../util';
import browser from 'webextension-polyfill/dist/browser-polyfill.js';
function openOptionsPage() {
    browser.runtime.openOptionsPage();
}

function clearCache() {
    browser.runtime.sendMessage({ name: 'clearCache' });
}

function updateMyIp() {
    browser.runtime.sendMessage({ name: 'updateMyIp' });
}

function hideEl(selector: string) {
    (document.querySelector(selector)! as HTMLElement).style.display = 'none';
}

function showEl(selector) {
    (document.querySelector(selector)! as HTMLElement).style.display = '';
}

async function groupConfigMoveUp(index: number) {
    const config = await browser.storage.local.get() as types.Configuration;
    if (index - 1 < 0) {
        return false;
    }
    const group = config.groups[index];
    const tmp = config.groups[index - 1];
    config.groups[index - 1] = group;
    config.groups[index] = tmp;
    console.log("group move up", group, tmp);
    await browser.storage.local.set(config);
    return true;
}

async function groupConfigMoveDown(index: number) {
    const config = await browser.storage.local.get() as types.Configuration;
    if (index + 1 >= config.groups.length) {
        return false;
    }
    const group = config.groups[index];
    const tmp = config.groups[index + 1];
    config.groups[index + 1] = group;
    config.groups[index] = tmp;
    console.log("group move down", group, tmp);
    await browser.storage.local.set(config);
    return true;
}

async function initGroupList() {
    console.log("init group list");
    const ul = document.querySelector("ul")!;
    while (ul.firstElementChild) {
        ul.firstElementChild.remove();
    }
    const template = document.querySelector("template")!;
    const config = await browser.storage.local.get() as types.Configuration;
    let index = 0;
    for (const group of config.groups) {
        const cloned = template.content.cloneNode(true) as HTMLFrameElement;
        const li = cloned.querySelector("li")!;
        li.dataset['index'] = `${index}`;
        li.querySelector(".group-name")!.textContent = group.name;
        index += 1;
        ul?.appendChild(li);
    }
}


function onULClick(event: MouseEvent) {
    if (event.target instanceof HTMLButtonElement) {
        const btn = event.target;
        const li = btn.closest("li")!;
        const ul = li.parentElement!;
        const index = parseInt(li.dataset["index"]!);
        if (btn.classList.contains("move-up")) {
            if (groupConfigMoveUp(index)) {
                const prev = li.previousElementSibling as HTMLLIElement;
                li.dataset["index"] = `${index - 1}`;
                prev.dataset["index"] = `${index}`
                ul.insertBefore(li, prev);
            }
        } else if (btn.classList.contains("move-down")) {
            if (groupConfigMoveDown(index)) {
                const next = li.nextElementSibling as HTMLLIElement;
                li.dataset["index"] = `${index + 1}`;
                next.dataset["index"] = `${index}`
                ul.insertBefore(next, li);
            }
        }
    }
}


async function init() {
    console.log("init");
    document.querySelector("#open-options-btn")!.addEventListener("click", openOptionsPage);
    document.querySelector("#clear-cache-btn")!.addEventListener("click", clearCache);
    document.querySelector("#update-myip-btn")!.addEventListener("click", updateMyIp);
    document.querySelector("ul")!.addEventListener("click", onULClick);
    const config = await browser.storage.local.get() as types.Configuration;
    if (isFirefox() && config.features.includes("limit_my_ip")) {
        showEl('#update-myip-btn');
    }
    initGroupList();
}

init();