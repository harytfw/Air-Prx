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

const DEFAULT_FACTOR = 0.75;
const MIN_CAP = 10;
export class Cache<K, T> {
    private capacity: number;
    private map: Map<K, Entry<K, T>>;
    private head: Entry<K, T> | null;
    private tail: Entry<K, T> | null;
    private factor: number;

    constructor() {
        this.capacity = 1000;
        this.map = new Map();
        this.head = null;
        this.tail = null;
        this.factor = DEFAULT_FACTOR;
    }

    setCapacity(cap: number) {
        if (cap < MIN_CAP) {
            console.warn('use mininum capacity', MIN_CAP);
        }
        this.capacity = Math.max(cap, MIN_CAP);
        this.attemptRemoveEntries();
    }

    setFactor(factor: number) {
        if (factor > 1 || factor < 0) {
            throw new Error('incorrect factor argument');
        }
        this.factor = Math.min(1, Math.max(0, factor));
    }

    attemptRemoveEntries() {
        if (this.size > this.capacity) {
            const allowSize = Math.floor(this.capacity * this.factor);
            let cursor = this.tail;
            let deleteCnt = this.size - allowSize;
            while (cursor !== null && deleteCnt > 0) {
                this.map.delete(cursor.key);
                const p = cursor.prev;
                cursor.prev = cursor.next = null;//Improve GC
                cursor = cursor.prev;
                deleteCnt -= 1;
            }
            cursor!.next = null;
            this.tail = cursor;
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
        if (this.head !== null && this.head === entry) {
            return entry.value;
        } else {
            this.detach(entry);
            this.linkToHead(entry);
            this.attemptRemoveEntries()
            return entry.value;
        }
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
            return;
        }

        if (this.head === entry) {
            this.head = entry.next;
            entry.prev = entry.next = null;
            return;
        }

        if (this.tail === entry) {
            this.tail = entry.prev;
        }

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

    private linkToHead(entry: Entry<K, T>) {
        if (this.head === null) {
            this.head = this.tail = entry;
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
    keys() {
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

    getHead() {
        return this.head;
    }

    getTail() {
        return this.tail;
    }

    get size() {
        return this.map.size;
    }
}
