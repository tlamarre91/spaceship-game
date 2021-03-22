const path = require("path");
const dotenv = require("dotenv");
const webpack = require("webpack");
dotenv.config();
module.exports = {
  mode: process.env.NODE_ENV,
  //mode: "production",
  //node: {
  //  fs: "empty"
  //},
  entry: "./src/admin-client/index.tsx",
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
      "~client": path.resolve("src/client"),
      "~admin-client": path.resolve("src/admin-client")
    }
  },
  output: {
    // TODO: this is the only difference between client and admin-client, so
    // just make this a parameter.
    filename: "admin-client.js",
  },
}
