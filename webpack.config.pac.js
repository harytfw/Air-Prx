const config = require('./webpack.config');
const path = require('path');

Object.assign(config, {
    entry: './src/index-pac.js',
    plugins: [],
    devtool: 'none',
    mode: 'development',
    output: {
        filename: 'pac.js',
        path: path.resolve(__dirname, 'dist-pac'),
    }
})
console.log(config);

module.exports = config;