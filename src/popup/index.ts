import * as types from '../types';
import { isFirefox } from '../util';
import browser from 'webextension-polyfill/dist/browser-polyfill.js';

async function getHostname() {
    const tab = (await browser.tabs.query({ active: true }))[0]
    console.log(tab);
    const hostname = (new URL(tab.url)).hostname;
    return hostname;
}

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
    (document.querySelector(selector) as HTMLElement).style.display = 'none';
}

function showEl(selector: string) {
    (document.querySelector(selector) as HTMLElement).style.display = '';
}

function setVisiable(selector: string, b: boolean) {
    (document.querySelector(selector) as HTMLElement).style.visibility = b ? "visiable" : "hidden";
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
    const tbody = document.querySelector("tbody")!;
    while (tbody.firstElementChild) {
        tbody.firstElementChild.remove();
    }
    const hostname = await getHostname();
    const template = document.querySelector("template")!;
    const config = await browser.storage.local.get() as types.Configuration;
    let index = 0;
    for (const group of config.groups) {
        const cloned = template.content.cloneNode(true) as HTMLFrameElement;
        const row = cloned.querySelector("tr")!;
        row.dataset['index'] = `${index}`;
        row.querySelector(".group-name")!.textContent = group.name;
        index += 1;
        const checkbox = row.querySelector(".add-hostname") as HTMLInputElement;
        if (group.matchType === 'hostname') {
            checkbox.classList.remove("hide-add-hostname");
            console.log(checkbox.className);
            checkbox.checked = group.rules ? group.rules.includes(hostname) : false;
        }
        tbody?.appendChild(row);
    }
}


function onULClick(event: MouseEvent) {
    if (event.target instanceof HTMLButtonElement) {
        const btn = event.target;
        const row = btn.closest("tr")!;
        const tbody = row.parentElement!;
        const index = parseInt(row.dataset["index"]!);
        if (btn.classList.contains("move-up")) {
            if (groupConfigMoveUp(index)) {
                const prev = row.previousElementSibling as HTMLLIElement;
                row.dataset["index"] = `${index - 1}`;
                prev.dataset["index"] = `${index}`
                tbody.insertBefore(row, prev);
            }
        } else if (btn.classList.contains("move-down")) {
            if (groupConfigMoveDown(index)) {
                const next = row.nextElementSibling as HTMLLIElement;
                row.dataset["index"] = `${index + 1}`;
                next.dataset["index"] = `${index}`
                tbody.insertBefore(next, row);
            }
        }
    }
}

function onInputChange(event: Event) {
    if (event.target instanceof HTMLInputElement) {
        const input = event.target;
        if (input.type === "checkbox") {
            const row = input.closest("tr")!;
            const index = parseInt(row.dataset["index"]!);
            console.log(index);
            if (!input.checked) {
                removeHostnameFromGroup(index);
            } else {
                addHostnameToGroup(index);
            }
        }
    }
}

async function addHostnameToGroup(index: number) {
    const config = await browser.storage.local.get("groups") as types.Configuration;
    const hostname = await getHostname();
    const group = config.groups[index];
    console.log("add hostname:", hostname, "to", group);
    if (Array.isArray(group.rules)) {
        group.rules.push(hostname);
    } else {
        group.rules = [hostname];
    }
    browser.storage.local.set(config);
}

async function removeHostnameFromGroup(index: number) {
    const config = await browser.storage.local.get("groups") as types.Configuration;
    const hostname = await getHostname();
    const group = config.groups[index];
    console.log("remove hostname:", hostname, "from", group);
    if (group.rules) {
        group.rules.filter(rule => rule !== hostname);
    }
    browser.storage.local.set(config);
}

async function init() {
    console.log("init");
    document.querySelector("#open-options-btn")!.addEventListener("click", openOptionsPage);
    document.querySelector("#clear-cache-btn")!.addEventListener("click", clearCache);
    document.querySelector("#update-myip-btn")!.addEventListener("click", updateMyIp);
    document.querySelector("table")!.addEventListener("click", onULClick);
    document.querySelector("table")!.addEventListener("change", onInputChange);
    const config = await browser.storage.local.get() as types.Configuration;
    if (isFirefox() && config.features.includes("limit_my_ip")) {
        setVisiable('#update-myip-btn', true);
    }
    initGroupList();
}

init();