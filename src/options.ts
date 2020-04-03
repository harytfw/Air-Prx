const $ = document.querySelector.bind(document);
const table = $('table')!;


function insertRow(rule) {
    const row = table.insertRow();
    let cell = row.insertCell();
    cell.textContent = `${table.tBodies[0].children.length}`
    cell = row.insertCell();
    cell.textContent = rule;

    cell = row.insertCell();

    let btn = document.createElement('button');
    btn.classList.add('del')
    btn.textContent = 'Del';
    cell.appendChild(btn);
}

table.addEventListener('click', (event) => {
    if (event.target instanceof HTMLButtonElement && event.target.matches('.del')) {
        event.target.closest('tr')?.remove();
    }
})

$("input#server")?.addEventListener('change', (e: any) => {
    browser.storage.local.set({ server: e.target.value });
});


browser.storage.local.get(['rules', 'server']).then(({ rules, server }) => {
    console.log(rules, server);
    if (rules) {
        for (const rule of rules) {
            insertRow(rule);
        }
    }
    if (server) {
        ($('#server-input') as HTMLInputElement).value = server;
    }
})

$('button#add-btn')?.addEventListener('click', (event) => {
    const rule = ($('input#rule-input') as HTMLInputElement).value;
    insertRow(rule);
})

$('button#save-btn')?.addEventListener('click', (event) => {
    const rows = Array.from(table.tBodies[0].rows);
    console.log(rows);
    const rules = rows.map(row => row.cells[1].textContent).filter(item => item !== '');
    console.log(rules);
    browser.storage.local.set({ rules, server: ($("#server-input") as HTMLInputElement).value });
})
