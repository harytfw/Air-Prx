import Core from './core'
import ruleLoader from './rule-loader';
import config from './webext/config';

const core = new Core();

ruleLoader.loadgfw().then(lines => {
    lines.forEach((line) => core.addRule(line))
})

// On the request to open a webpage
function handleProxyRequest(requestInfo) {
    if (core.isMatch(requestInfo.url)) {
        return config.proxyInfo;
    }
    return { type: "direct" };
}

browser.proxy.onError.addListener(error => {
    console.error(`Proxy error: ${error.message}`);
});

// Listen for a request to open a webpage
browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });

window.core = core;
window.ruleLoader = ruleLoader