import "module-alias/register";
import "source-map-support/register";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import * as socketio from "socket.io";
import * as path from "path";
import { log } from "~shared/log";
import { GameServer } from "./GameServer";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV;
const SERVE_STATIC = true;

const app = express();
const httpServer = http.createServer(app);

if (NODE_ENV == "development" && SERVE_STATIC && process.env.STATIC_DIR) {
  app.use(express.static(process.env.STATIC_DIR));
  log.info("serving static content");
} else {
  log.info(NODE_ENV);
}

app.set("views", `${__dirname}/../templates`);
app.set("view engine", "pug");

app.get("/", async (req, res) => {
  res.render("base");
});

const gameServer = new GameServer(httpServer);
gameServer.start();
