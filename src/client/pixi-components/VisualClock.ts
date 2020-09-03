import * as Pixi from "pixi.js";
import { log } from "~shared/log";

export interface VisualClockConfig {
  maxTimeMs: number;
  //width: number;
  height: number;
}

/**
 * Displays a decreasing progress bar to visualize remaining turn time
 */
export class VisualClock {
  container: Pixi.Container;
  barSprite: Pixi.Sprite;
  private resources: Record<string, Pixi.LoaderResource>;
  maxTimeMs: number;
  width: number;
  height: number;
  private y: number;
  private startTime: number;

  constructor(resources: Record<string, Pixi.LoaderResource>, config: VisualClockConfig) {
    this.maxTimeMs = config.maxTimeMs;
    this.width = window.innerWidth;
    this.height = config.height;
    this.resources = resources;
    this.container = new Pixi.Container();
    this.container.scale.x = 1;
    this.container.scale.y = 1;
    this.barSprite = new Pixi.Sprite(resources["hgradient"].texture);
    this.container.addChild(this.barSprite);
    this.barSprite.width = window.innerWidth;
    this.barSprite.height = window.innerHeight;
    this.setY();
  }

  refresh() {
    const progressFraction = Math.min(1, (Date.now() - this.startTime) / this.maxTimeMs);
    const mask = new Pixi.Graphics();
    mask.beginFill(0xff3333);
    mask.drawRect(0, this.y, this.width * (1 - progressFraction), this.height);
    this.barSprite.mask = mask;
  }

  private setY() {
    this.y = window.innerHeight - this.height;
    this.container.y = this.y;
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.setY();
  }

  restart() {
    this.startTime = Date.now();
  }
}
