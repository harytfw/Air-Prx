import * as types from '../types';
import stringify from 'stringify-object';



document.querySelector('#view-proxy-result-btn')!.addEventListener('click', () => {
    console.log('sned message');
    browser.runtime.sendMessage({ name: 'getCache' }).then((entries: [string, types.ProxyInfo]) => {
        console.log('get response');
        const table = document.querySelector('table')!;
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
    })
})