const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
module.exports = {
    entry: {
        'bg/main': './src/bg/main.ts',
        'options/index': './src/options/index.ts',
        'options/result': './src/options/result.ts',
        'popup/index': './src/popup/index.ts',
        'pac/pac': './src/pac/pac.ts',
    },
    target: 'node',
    mode: 'development',
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
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [
                    'css-loader',
                    'less-loader'
                ]
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [

        new CopyPlugin([
            { from: './src/bg/main.html', to: './bg/main.html' },
            { from: './src/manifest.json', to: './' },
            { from: './options/*.*(html|css)', to: './', context: './src' },
            { from: './popup/*.*(html|css)', to: './', context: './src' },
            { from: './data/*.txt', to: './', context: './src' },
        ]),
    ],
};