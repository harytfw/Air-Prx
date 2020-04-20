function notImplemented() {
    return Promise.reject("not implemented");
}

const BASE_PATH = './data';

export default {

    loadText(text: string): string[] {
        return text
            .trim()
            .split('\n')
            .map(line => line.trim())
            .filter(line => !line.startsWith('!'))
            .filter(line => {
                return line.startsWith('/') || line.startsWith('.') || line.startsWith('@@') || line.startsWith('||') || line.startsWith('|');
            })
    },

    loadRemoteGFW(): Promise<string[]> {
        return Promise.reject("not implemented");
    },

    loadURL() {
        return notImplemented();
    },

    loadEmbededGFW(): Promise<string[]> {
        return fetch(browser.runtime.getURL(BASE_PATH + '/gfwlist.txt')).then(res => {
            return res.text()
        }).then(text => {
            return this.loadText(text);
        })
    },

    loadWebExtStorage(area: 'local' | 'sync' = 'local'): Promise<string[] | undefined> {
        return browser.storage.local.get('rules').then(obj => {
            return obj['rules'];
        });
    },

    loadLocalStorage() {
        const text = localStorage.getItem('rules') as string;
        return this.loadText(text);
    },

    loadChinaCIDR(): Promise<string[]> {
        return fetch(browser.runtime.getURL(BASE_PATH + '/china-cidr.txt'))
            .then(res => res.text())
            .then(text => text
                .trim()
                .split('\n')
                .map(line => line.trim())
                .filter(line => !line.startsWith('#'))
            );
    }

}