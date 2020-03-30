export default {
    saveLocalStorage(text:string) {
        return localStorage.setItem('rules', text);
    },
    saveWebExtStorage(text:string, area: 'local' | 'sync' = 'local') {
        return browser.storage[area].set({ rules: text });
    },
}