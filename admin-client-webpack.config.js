const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  mode: process.env.NODE_ENV,
  //mode: "production",
  node: {
    fs: "empty"
  },
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
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "~shared": path.resolve("src/shared"),
      "~client": path.resolve("src/client"),
      "~admin-client": path.resolve("src/admin-client")
    }
  },
  output: {
    filename: "client.js",
  },
}
