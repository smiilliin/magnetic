const path = require("path");

module.exports = {
  entry: "./src/app.ts", // entry point
  output: {
    filename: "bundle.js", // output file name
    path: path.resolve(__dirname, "build"), // output directory
    clean: true, // clean the output directory before each build
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"], // resolve these extensions
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // match .ts and .tsx files
        use: "ts-loader", // use ts-loader to transpile TypeScript
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg)$/, // handle image assets
        type: "asset/resource",
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, "dist"), // serve files from dist
    compress: true, // enable gzip compression
    port: 8080, // port for the development server
    open: true, // open the browser after server has started
  },
  mode: "development",
  devtool: "source-map", // enable source maps for debugging
};
