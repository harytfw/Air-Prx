import { Cache } from '../src/proxy-cache'


const cache = new Cache<number, string>();

cache.setCapacity(10);
cache.setFactor(0.5);

for (let i = 0; i < 10; i++) {
    cache.set(i, `${i}`);
}

console.assert(cache.size === 10,' size != 10');
console.log(cache.keys())

cache.set(10,'10');

console.log(cache.keys());
console.log(cache.entries());
console.log('head:',cache.getHead());
console.log('tail:',cache.getTail());
console.assert(cache.size === 5,' size != 5');
