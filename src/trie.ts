
export class TrieNodeMeta {
    exact: boolean;
    exception: boolean;
    isParentDomain: boolean;
    exactProtocol: string;
    path: string[];
    constructor() {
        this.exception = false;
        this.isParentDomain = false;
        this.exact = false;
        this.exactProtocol = '';
        this.path = [];
    }
}

function binSearch<U, T>(arr: U[], target: T, fn: (item: U) => T) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        const c = fn(arr[mid]);
        if (c === target) {
            return mid;
        }
        if (c > target) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    return -1;
}

export class TrieNode {
    value: string | null;
    children: TrieNode[];
    meta: TrieNodeMeta | null;
    constructor() {
        this.value = null;
        this.children = [];
        this.meta = null;
    }

    sort() {
        this.children = this.children.sort((a, b) => {
            if (a.value === b.value) {
                return 0
            }
            if (a.value == null) {
                return 1;
            }
            if (b.value == null) {
                return -1;
            }
            if (a.value > b.value) {
                return 1
            }
            return -1;
        });
        for (const child of this.children) {
            child.sort();
        }
    }

    insert(path: string[], index: number, meta: TrieNodeMeta) {

        if (index >= path.length) {
            return;
        }

        for (const child of this.children) {
            if (child.value === path[index]) {
                if (index + 1 == path.length) {
                    child.meta = meta;
                } else {
                    child.insert(path, index + 1, meta);
                }
                return;
            }
        }
        const last = new TrieNode();
        this.children.push(last);
        last.value = path[index]
        if (index + 1 === path.length) {
            last.meta = meta;
        } else {
            last.insert(path, index + 1, meta);
        }
    }

    getMeta(path: string[], index: number): TrieNodeMeta | null {
        // console.log('Find: ', path, 'in', this);
        if (index >= path.length) {
            return null;
        }
        let curArr = this.children;
        let prevNode: TrieNode | null = null;
        while (index < path.length) {
            let pos = binSearch(curArr, path[index], a => a.value);
            if (pos === -1) {
                return prevNode !== null ? prevNode.meta : null;
            }
            prevNode = curArr[pos];
            curArr = curArr[pos].children;
            index += 1;
        }
        return prevNode !== null ? prevNode.meta : null;
    }
}
