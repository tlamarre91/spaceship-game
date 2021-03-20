import React from "react";
import ReactDOM from "react-dom";
import { log } from "~shared/log";
import AdminInterface from "./components/AdminInterface";

function main() {
  log.info("heyo");
  console.log("heyo");
  ReactDOM.render(<AdminInterface />, document.getElementById("content"));
}

document.addEventListener("DOMContentLoaded", main);
