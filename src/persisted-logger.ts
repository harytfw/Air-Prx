export class PersistedLogger {
    name: string;
    queue: any[];
    limit: number;
    id: number;

    constructor(name: string) {
        this.name = name;
        this.id = 0;
        this.queue = [];
        this.limit = 5;
    }

    add(obj) {
        this.queue.push(`${Date.now()}@${JSON.stringify(obj)}`);
        if (this.queue.length >= this.limit) {
            this.flush();
        }
    }

    flush() {
        for (let i = 0; i < this.queue.length; i++) {
            localStorage.setItem(this.computeName(i), this.queue[i]);
            this.id += 1;
        }
        this.queue = [];
    }

    getAll() {
        const keys = this.getKeys();
        const result = keys.map(key => localStorage.getItem(key)!);
        return result;
    }

    clearAll() {
        const keys = this.getKeys();
        keys.forEach(key => localStorage.removeItem(key));
    }

    getKeys() {
        const k: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (typeof key === 'string' && key.startsWith(this.name)) {
                k.push(key);
            }
        }
        return k;
    }

    computeName(id: number) {
        return `${this.name}_${id}`;
    }
}