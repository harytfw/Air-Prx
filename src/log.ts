export function debugLog(...args) {
    if ((window as any).debug) {
        console.debug(...args);
    }
}