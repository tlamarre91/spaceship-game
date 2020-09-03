import React from "react";
import { render } from "react-dom";
import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { ALPHABET } from "~shared/util";
import { log } from "~shared/log";
import { makeAssetUrl } from "./assets";
import { GameClient } from "./GameClient";
import {
  GameEntity,
} from "~shared/model";

const config = {
  antialias: true,
  transparent: false
}

function main() {
  const pixiApp = new Pixi.Application(config);

  const renderer = pixiApp.renderer;
  renderer.view.style.position = "absolute";
  renderer.view.style.display = "block";
  renderer.resize(window.innerWidth, window.innerHeight);


  const gameContainer = document.getElementById("game");
  gameContainer.appendChild(pixiApp.view);

  pixiApp.loader
    .add("bg", makeAssetUrl("space-bg.png"))
    .add("ships", makeAssetUrl("ships.json"))
    .add("bullet", makeAssetUrl("bullet.png"))
    .add("hexagons", makeAssetUrl("hexagons.json"))
    .add("hgradient", makeAssetUrl("hgradient.png"))
    .load((loader, resources) => {
      const client = new GameClient(pixiApp, loader, resources);
      client.start();

      window.onresize = client.onWindowResize;
    });
}

document.addEventListener("DOMContentLoaded", main);
