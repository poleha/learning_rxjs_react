module.exports = {
    entry: "./index.js",
    devtool: 'source-map',
    debug: true,
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ['babel-loader'],
                exclude: /node_modules/, 
            }
        ]
    }
};