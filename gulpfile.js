const path = require("path");
const gulp = require("gulp");
const del = require("del");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const tsServerProj = ts.createProject("tsconfig.server.json");
const webpack = require("webpack-stream");
const webpackCompiler = require("webpack");
const dotenv = require("dotenv");
dotenv.config();

const TARGET_DIR = process.env.TARGET_DIR;
const STATIC_DIR = process.env.STATIC_DIR;

function cleanAssets() {
  return del(path.join(STATIC_DIR, "assets", "*"));
}

function copyAssets() {
  return gulp.src(path.join("assets", "**", "*"))
    .pipe(gulp.dest(path.join(STATIC_DIR, "assets")));
}

function cleanServer() {
  return del([
    path.join(TARGET_DIR, "server"),
    path.join(TARGET_DIR, "shared")
  ]);
}

function cleanClient() {
  return del(path.join(STATIC_DIR, "js", "client.js"));
}

function cleanTemplates() {
  return del(path.join(TARGET_DIR, "server", "templates"));
}

function copyTemplates() {
  return gulp.src(path.join("src", "templates", "*"))
    .pipe(gulp.dest(path.join(TARGET_DIR, "templates")));
}

function cleanShaders() {
  return del(path.join(STATIC_DIR, "shaders", "*"));
}

function copyShaders() {
  return gulp.src(path.join("src", "shaders"))
    .pipe(gulp.dest(path.join(STATIC_DIR, "shaders")));
}

function buildServer() {
  return tsServerProj.src()
    .pipe(sourcemaps.init())
    .pipe(tsServerProj())
    .js.pipe(sourcemaps.write('.', {
      includeContent: false,
      // sourceRoot: "../src"
      sourceRoot: path.join("..", "src")
    }))
    .pipe(gulp.dest("dist"));
}

function buildClient() {
  // TODO: remember to configure build for production!
  // do this by checking NODE_ENV here and picking the right webpack config
  // (set mode: "production" and disable devtool: "inline-source-map")
  const webpackConfig = require("./webpack.config");
  return gulp.src(path.join("src", "client", "index.tsx"))
    .pipe(webpack(webpackConfig, webpackCompiler))
    .pipe(gulp.dest(path.join(STATIC_DIR, "js")));
}

exports.server = gulp.series(cleanServer, buildServer);
exports.client = gulp.series(cleanClient, buildClient);
//exports.clean = gulp.parallel(cleanClient, cleanServer, cleanTemplates, cleanShaders, cleanAssets);
exports.clean = () => { return del(path.join(TARGET_DIR, "*")) };

exports.watch = (cb) => {
  const opts = { ignoreInitial: false };
  gulp.watch(["src/server/**/*", "src/shared/**/*"], opts, exports.server);
  gulp.watch(["src/client/**/*", "src/shared/**/*"], opts, exports.client);
  gulp.watch(["src/templates/**/*"], opts, gulp.series(cleanTemplates, copyTemplates));
  gulp.watch(["assets/**/*"], opts, gulp.series(cleanAssets, copyAssets));
  gulp.watch(["src/shaders/**/*"], opts, gulp.series(cleanShaders, copyShaders));
  cb();
}

exports.default = gulp.series(exports.clean, gulp.parallel(buildServer, buildClient, copyTemplates, copyShaders, copyAssets));
