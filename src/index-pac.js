import Core from './core';
import config from './pac/config';
import ruleLoader from './rule-loader';
import gfwText from './gfwlist.txt';

const core = new Core();

ruleLoader.loadText(gfwText).forEach(line => {
    lines.forEach((line) => core.addRule(line))
})

function FindProxyForURL(url, host) {
    if (core.isMatch(host)) {
        return config.proxyInfo
    }
    return null;
}
alert(this);
alert(alert);
window.FindProxyForURL = FindProxyForURL;