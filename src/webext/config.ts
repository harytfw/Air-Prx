import { platform } from "os";
import { ProxyInfo } from "../types";

const proxyInfo: ProxyInfo = {
    type: 'http',
    host: '127.0.0.1',
    port: 1080
}

browser.storage.local.get(['server']).then(({ server }) => {
    if (typeof server === 'string') {
        const url = new URL(server);
        proxyInfo.type = url.protocol.replace(/:/g, '');
        proxyInfo.host = url.hostname;
        proxyInfo.port = parseInt(url.port);
        console.log('load proxy:', proxyInfo);
    }
})

export default {
    proxyInfo,
}