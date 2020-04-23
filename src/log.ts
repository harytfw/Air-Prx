


export function debugLog(...args) {
    if ((window as any).debug === true) {
        console.debug(...args);
    }
}

export function persistLog(...args) {

}