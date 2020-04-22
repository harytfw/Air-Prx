const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
    entry: {
        'bg/main': './src/bg/main.ts',
        'options/index': './src/options/index.ts',
    },
    target: 'node',
    mode: "production",
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
            { from: './options/options.*(html|css)', to: './', context: './src' },
            { from: './data/*.txt', to: './', context: './src' },
        ]),
    ],
};