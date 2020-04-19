const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        'bg/main': './src/bg/main.ts',
        'options/options': './src/options/options.ts',
    },
    mode: "development",
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }, {
                test: /\.txt$/i,
                use: 'raw-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    target: "web",
    plugins: [
        new CopyPlugin([
            { from: './src/bg/main.html', to: './bg/main.html' },
            { from: './options/options.*(html|css)', to: './', context: './src' },
            { from: './src/manifest.json', to: './' },
            { from: './src/gfwlist.txt', to: './' },
        ]),
    ],
};