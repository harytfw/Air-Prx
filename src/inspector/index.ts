import stringify from "stringify-object";

function getTabSelect() {
    return document.querySelector('#tab-select') as HTMLSelectElement;
}

function getTbody() {
    return document.querySelector('#tables-container tbody') as HTMLTableSectionElement;
}

async function getTabIds(): Promise<[number, string][]> {
    const tabs = await browser.tabs.query({});
    return tabs.filter(tab => Number.isInteger(tab.id as any)).map(tab => [tab.id, tab.title]) as [number, string][];
}

async function onNewTab(tab) {
    const select = getTabSelect();
    const opt = new Option(`${tab.id} - ${tab.title}`, tab.id);
    select.appendChild(opt);
}

async function onRemoveTab(tab) {
    const select = getTabSelect();
    const opt = Array.from(select.options).find(a => parseInt(a.value) == tab.id);
    opt?.remove();
}

function onNewRequest(details) {
    let tbody = getTbody();
    const row = tbody.insertRow();
    row.dataset['id'] = details.requestId;
    let cell = row.insertCell();
    cell.textContent = details.requestId;
    cell = row.insertCell();
    cell.textContent = details.url;
    cell = row.insertCell();
    cell.textContent = stringify(details.proxyInfo);
    cell = row.insertCell();
    cell.textContent = 'Not Complete';
}

function onRequestComplete(details) {
    const tbody = getTbody();
    const row = tbody.querySelector(`[data-id='${details.requestId}']`);
    if (!row) {
        return;
    }
    if (row.lastElementChild) {
        row.lastElementChild.textContent = details.statusLine;
    }
}

function onSelectTab() {
    browser.webRequest.onBeforeRequest.removeListener(onNewRequest);
    browser.webRequest.onCompleted.removeListener(onRequestComplete);
    let tbody = getTbody();
    while (tbody.firstElementChild) {
        tbody.firstElementChild.remove();
    }
    let select = getTabSelect();
    let tabId = parseInt(select.value);
    if (!Number.isInteger(tabId)) {
        return;
    }
    browser.webRequest.onBeforeRequest.addListener(onNewRequest, { urls: ['<all_urls>'], tabId: tabId == -1 ? undefined : tabId })
    browser.webRequest.onCompleted.addListener(onRequestComplete, { urls: ['<all_urls>'], tabId: tabId == -1 ? undefined : tabId })
    if (tabId != -1) {
        browser.tabs.reload(tabId);
    }
}

async function init() {
    browser.tabs.onCreated.addListener(onNewTab);
    browser.tabs.onRemoved.addListener(onRemoveTab);
    const select = getTabSelect();
    select.addEventListener('change', (e) => {
        onSelectTab()
    });
    for (const pair of await getTabIds()) {
        const opt = new Option(`${pair[0]} - ${pair[1]}`, `${pair[0]}`);
        select.appendChild(opt);
    }
    onSelectTab();
}

init();