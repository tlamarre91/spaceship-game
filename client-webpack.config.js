const path = require("path");
const dotenv = require("dotenv");
const webpack = require("webpack");
dotenv.config();
module.exports = {
  mode: process.env.NODE_ENV,
  //mode: "production",
  //node: {
  //  fs: "empty" // TODO: determine if this is an appropriate fix for webpack error with winston importing fs
  //},
  entry: "./src/client/index.tsx",
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: "ts-loader",
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser"
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    fallback: {
      os: require.resolve("os-browserify/browser"),
      fs: false,
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      zlib: require.resolve("browserify-zlib"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
    },
    alias: {
      "~shared": path.resolve("src/shared"),
      /* "~server": path.resolve("src/server"), */
      "~client": path.resolve("src/client"),
    }
  },
  output: {
    filename: "client.js",
  },
}
