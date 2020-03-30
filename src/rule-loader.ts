export default {
    loadText(text: string): string[] {
        return text
            .trim()
            .split('\n')
            .map(line => line.trim())
            .filter(line => !line.startsWith('!'))
            .filter(line => {
                return line.startsWith('.') || line.startsWith('@@') || line.startsWith('||') || line.startsWith('|');
            })
    },
    loadgfw(): Promise<string[]> {
        return fetch(browser.runtime.getURL('./gfwlist.txt')).then(res => {
            return res.text()
        }).then(text => {
            return this.loadText(text);
        })
    },
    loadGithub() {
        return null
    },
    loadWebExtStorage(area: 'local' | 'sync' = 'local') {
        return browser.storage.local.get('rules').then(obj => {
            return this.loadText(obj['rules']);
        });
    },
    loadLocalStorage() {
        const text = localStorage.getItem('rules') as string;
        return this.loadText(text);
    },
}