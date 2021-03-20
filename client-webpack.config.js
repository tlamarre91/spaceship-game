const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  mode: process.env.NODE_ENV,
  //mode: "production",
  node: {
    fs: "empty" // TODO: determine if this is an appropriate fix for webpack error with winston importing fs
  },
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
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
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
