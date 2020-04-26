import * as types from '../types';
import stringify from 'stringify-object';


function removeTables() {
    const tables = document.querySelector("#tables-container");
    while (tables?.firstChild) {
        tables.firstChild.remove();
    }
}

function createTable(title: string) {
    const tables = document.querySelector("#tables-container")!;
    const head = document.createElement("h3");
    head.innerText = title;
    const template = document.querySelector("template");
    tables.appendChild(head);
    tables.appendChild(template?.content.cloneNode(true)!);
    const table = tables.querySelector("table:last-child");
    return table as HTMLTableElement;
}

interface Result { [key: string]: [string, types.ProxyInfo] }

document.querySelector('#view-proxy-result-btn')!.addEventListener('click', () => {
    console.log('sned message');
    browser.runtime.sendMessage({ name: 'getCache' }).then((result: Result) => {
        console.log(result);
        removeTables();
        for (const key of Object.keys(result)) {
            const entries = result[key];
            const table = createTable(key);
            console.log('get response');
            const tbody = table.tBodies[0]!;
            while (tbody.firstElementChild) {
                tbody.firstElementChild.remove();
            }
            for (const e of entries) {
                const row = tbody.insertRow();
                let cell = row.insertCell();
                cell.textContent = e[0];
                cell = row.insertCell();
                cell.textContent = stringify(e[1]);
            }
        }
    })
})