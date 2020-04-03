import Core from './core'
import ruleLoader from './rule-loader';
import config from './webext/config';

const core = new Core();

ruleLoader.loadgfw().then(lines => {
    lines.forEach((line) => core.addRule(line))
}).then(() => {
    return ruleLoader.loadWebExtStorage()
}).then(lines => {
    if (Array.isArray(lines)) {
        console.log('load web ext storage', lines);
        lines.forEach(line => core.addRule(line))
    }
}).then(() => {
    core.initComplete();
})

function handleProxyRequest(requestInfo) {
    if (core.isMatch(requestInfo.url)) {
        if (core.debug) {
            console.log(requestInfo.url, 'will use proxy', config.proxyInfo);
        }
        return config.proxyInfo;
    }
    return { type: "direct" };
}

browser.proxy.onError.addListener(error => {
    console.error(`Proxy error: ${error.message}`);
});

// Listen for a request to open a webpage
browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });



(window as any).core = core;
(window as any).ruleLoader = ruleLoader