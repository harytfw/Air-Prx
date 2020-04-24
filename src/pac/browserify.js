var browserify = require("browserify");
var tsify = require("tsify");
var fs = require("fs");
var watchify = require('watchify');

const b = browserify({
    entries: ['./pac/pac.ts'],
    cache: {},
    packageCache: {},
    plugin: [watchify, tsify]
});

function bundle() {
    b.bundle()
        .pipe(fs.createWriteStream("./dist/pac.js"));
}

b.on('update',bundle);
bundle();
