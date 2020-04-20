class Entry<K, T> {
    next: Entry<K, T> | null;
    prev: Entry<K, T> | null;
    value: T;
    key: K;
    constructor(key: K, value: T) {
        this.key = key;
        this.value = value;
        this.next = null;
        this.prev = null;
    }
    hasNext() {
        return this.next !== null;
    }
    hasPrev() {
        return this.prev !== null;
    }
}

const factor = 0.75;

export class Cache<K, T> {
    private capacity: number;
    private map: Map<K, Entry<K, T>>;
    private head: Entry<K, T> | null;

    constructor() {
        this.capacity = 1000;
        this.map = new Map();
        this.head = null;
    }

    setCapacity(cap: number) {
        this.capacity = Math.max(cap, 20);
        this.attemptRemoveEntries();
    }

    attemptRemoveEntries() {
        if (this.map.size >= this.capacity) {
            const allowSize = Math.floor(this.capacity * factor);
            let cnt = 0;
            let entry = this.head;
            let arr: any = [];
            while (entry !== null && cnt < allowSize) {
                entry = entry.next;
                arr.push([entry?.key, entry?.value]);
                cnt += 1;
            }
            if (entry !== null && entry.prev !== null) {
                entry.prev.next = null;
            }
            while (entry !== null) {
                const key = entry.key;
                const tmp = entry.next;
                entry.next = null;
                entry.prev = null;
                this.map.delete(key);
                entry = tmp;
            }

        }
    }

    has(key: K) {
        return this.map.has(key);
    }

    get(key: K): T | null {
        let entry = this.map.get(key);
        if (entry === undefined) {
            return null;
        }
        let value = entry.value;
        this.detach(entry);
        this.linkToHead(entry);
        this.attemptRemoveEntries()
        return value
    }

    set(key: K, value: T) {
        let entry: Entry<K, T>;
        if (!this.has(key)) {
            entry = new Entry(key, value);
            this.map.set(key, entry);
            this.linkToHead(entry);
        } else {
            entry = this.map.get(key)!;
            this.detach(entry);
            this.linkToHead(entry);
        }
        entry.value = value;
        this.attemptRemoveEntries();
    }

    private detach(entry: Entry<K, T>) {
        if (this.head === null) {
            entry.next = entry.prev = null;
            return;
        } else if (this.head === entry) {
            this.head = entry.next;
            entry.next = entry.prev = null;
            return;
        } else {
            if (!entry.hasPrev()) {
                console.trace(`previous entry didn't exist`);
            }
            const prevEntry = entry.prev!;
            if (entry.hasNext()) {
                const nextEntry = entry.next!;
                nextEntry.prev = prevEntry;
                prevEntry.next = nextEntry;
            } else {
                prevEntry.next = null;
            }
            entry.next = entry.prev = null;
        }
    }

    private linkToHead(entry: Entry<K, T>) {
        if (this.head === null) {
            this.head = entry;
            return;
        }
        if (entry.hasPrev() || entry.hasNext()) {
            console.trace('previous entry or next entry should be null');
        }
        const tmpHead = this.head;
        tmpHead.prev = entry;

        entry.next = tmpHead;
        entry.prev = null;
        this.head = entry;
    }

    clear() {
        while (this.head !== null) {
            const n = this.head.next;
            this.head.next = null;
            this.head.prev = null;
            this.head = n;
        }
        this.map.clear()
    }
    values() {
        const arr: T[] = [];
        let h = this.head;
        while (h !== null) {
            arr.push(h.value);
            h = h.next;
        }
        return arr;
    }
    key() {
        const arr: K[] = [];
        let h = this.head;
        while (h !== null) {
            arr.push(h.key);
            h = h.next;
        }
        return arr;
    }
    entries() {
        const arr: [K, T][] = [];
        let h = this.head;
        while (h !== null) {
            arr.push([h.key, h.value]);
            h = h.next;
        }
        return arr;
    }
}

if (!module.parent) {
    const random = (start, end) => {
        return Math.floor((Math.random() * (end - start))) + start;
    }
    const cache = new Cache<number, string>();
    cache.setCapacity(10);

    for (let i = 0; i < 100; i++) {
        const n = random(0, 100);
        cache.set(n, `${n}`);
    }

    for (let i = 0; i < 100; i++) {
        const n = random(0, 100);
        const v = cache.get(n);
        console.info('visit', n, "get", v, "entries", cache.entries());
    }
}