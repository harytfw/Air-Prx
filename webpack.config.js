const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
module.exports = {
    entry: {
        'bg/main': './src/bg/main.ts',
        'options/index': './src/options/index.ts',
    },
    target: 'node',
    mode: "development",
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: { appendTsSuffixTo: [/\.vue$/] }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    hotReload: false // 关闭热重载
                }
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'less-loader'
                ]
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    target: "web",
    plugins: [
        new VueLoaderPlugin(),
        new CopyPlugin([
            { from: './src/bg/main.html', to: './bg/main.html' },
            { from: './src/manifest.json', to: './' },
            { from: './options/options.*(html|css)', to: './', context: './src' },
            { from: './data/*.txt', to: './', context: './src' },
        ]),
    ],
};