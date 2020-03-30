
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
    children: TrieNode[];
    meta: TrieNodeMeta | null;
    constructor() {
        this.value = null;
        this.children = [];
        this.meta = null;
    }

    insert(path: string[], index: number, meta: TrieNodeMeta) {

        if (index >= path.length) {
            return;
        }

        if (this.value === null) {
            this.value = path[index];
        }

        if (index + 1 === path.length) {
            if (this.meta !== null) {
                console.warn('overwrite meta', this.meta);
            }
            this.meta = meta;
            return;
        }

        for (const child of this.children) {
            if (child.value === path[index + 1]) {
                child.insert(path, index + 1, meta);
                return;
            }
        }
        this.children.push(new TrieNode());
        this.children[0].insert(path, index + 1, meta);
    }

    getMeta(path: string[], index: number): TrieNodeMeta | null {
        // console.log('Find: ', path, 'in', this);
        if (this.value === null || index >= path.length) {
            return null;
        }
        if (this.value === path[index]) {
            if (this.children.length === 0) {
                // 部分匹配也要返回
                return this.meta;
            }
            let meta: TrieNodeMeta | null = null;
            for (const child of this.children) {
                meta = child.getMeta(path, index + 1);
                if (meta !== null) {
                    break;
                }
            }
            return meta;
        }
        return null;
    }
}
