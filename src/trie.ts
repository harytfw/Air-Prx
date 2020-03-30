
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

export class TrieNode {
    value: string | null;
    next: TrieNode | null;
    children: TrieNode | null;
    meta: TrieNodeMeta | null;
    constructor() {
        this.value = null;
        this.next = null;
        this.children = null;
        this.meta = null;
    }

    insert(path: string[], index: number, meta: TrieNodeMeta) {

        if (index >= path.length) {
            return;
        }

        if (this.value === null) {
            this.value = path[index];
        }

        if (path[index] === this.value) {
            if (index + 1 >= path.length) {
                this.meta = meta;
                return;
            }
            if (this.children === null) {
                this.children = new TrieNode();
            }
            // console.log(`Insert '${path[index + 1]}' under ${this.value}`);
            this.children.insert(path, index + 1, meta);
        } else {
            let prev: TrieNode = this;
            while (prev.next !== null && prev.next.value !== path[index]) {
                prev = prev.next;
            }
            if (prev.next === null) {
                prev.next = new TrieNode();
            }
            // console.log(`Add '${path[index]}' next to ${prev.value}`);
            prev.next.insert(path, index, meta);
        }
    }

    getMeta(path: string[], index: number): TrieNodeMeta | null {
        // console.log('Find: ', path, 'in', this);
        if (index >= path.length || this.value === null) {
            return null;
        }
        if (this.value === path[index]) {
            if (this.children === null) {
                // 部分匹配也要返回
                return this.meta;
            }
            let meta = this.children.getMeta(path, index + 1);
            if (meta !== null) {
                return meta;
            }
            return this.meta;
        } else {
            let prev: TrieNode = this;
            while (prev.next !== null && prev.next.value !== path[index]) {
                prev = prev.next;
            }
            if (prev.next === null) {
                return null;
            }
            return prev.next.getMeta(path, index);
        }
    }
}
