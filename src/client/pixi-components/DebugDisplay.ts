import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { log } from "~shared/log";
import { rad2deg } from "~shared/util";
import * as debug from "~shared/model/DebugItem";
import {
  HexVector,
  HexSegment
} from "~shared/model";

const { PI, sqrt, abs, acos } = Math;

export interface DebugDisplayConfig {
  boardScale: number;
}

export class DebugDisplay {
  private resources: Record<string, Pixi.ILoaderResource>;
  //viewport: Viewport;
  private TEXT_STYLE = {
    fontFamily: "Arial",
    fontSize: 12,
    fill: 0xffffff
  };
  renderedText: Pixi.Text = new Pixi.Text("", this.TEXT_STYLE);
  viewportContainer: Pixi.Container;
  private textEntries: Map<string, string> = new Map();
  private renderedItems: Map<string, Pixi.DisplayObject> = new Map();
  private boardScale: number;

  constructor(resources: Record<string, Pixi.ILoaderResource>, config: DebugDisplayConfig) {
    this.resources = resources;
    this.boardScale = config.boardScale;
    this.viewportContainer = new Pixi.Container();
    this.viewportContainer.sortableChildren = true;
  }

  setTextEntry(key: string, val: string) {
    this.textEntries.set(key, val);
  }

  removeTextEntry(key: string) {
    this.textEntries.delete(key);
  }

  setItem(key: string, item: debug.DebugItem) {
    const currentItem = this.renderedItems.get(key);
    if (currentItem) {
      this.viewportContainer.removeChild(currentItem);
    }
    const renderedItem = this.renderItem(item);
    if (renderedItem) {
      this.renderedItems.set(key, renderedItem);
      this.viewportContainer.addChild(renderedItem);
    }
  }

  removeItem(key: string) {
    const currentItem = this.renderedItems.get(key);
    if (currentItem) {
      this.viewportContainer.removeChild(currentItem);
    }
    this.renderedItems.delete(key);
  }

  /**
   * Toggle or set visibility of debug item by key
   */
  setVisible(key: string, visible: boolean | null = null) {
    const item = this.renderedItems.get(key);
    if (item) {
      item.visible = visible != null ? visible : (! item.visible);
    }
  }

  renderLabeledHexagon(item: debug.LabeledHexagon): Pixi.Container {
    // TODO: separate spritesheets by purpose. i.e. "debug", "production"
    const sprite = new Pixi.Sprite(this.resources["hexagons"].textures![item.spriteName]);
    sprite.tint = item.color;
    sprite.alpha = item.alpha;
    sprite.scale.x = item.scale;
    sprite.scale.y = item.scale;
    sprite.zIndex = item.zIndex;
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    const renderedText = new Pixi.Text(item.text, this.TEXT_STYLE);
    renderedText.zIndex = item.zIndex + 1;
    const container = new Pixi.Container();
    container.sortableChildren = true;
    //const pos = params?.offset ? item.position.plus(params.offset) : item.position
    const pos = item.position;
    const [x, y] = pos.toCartesian(this.boardScale);
    container.x = x;
    container.y = y;
    container.addChild(sprite);
    container.addChild(renderedText);
    return container;
  }

  renderCompositeItem(item: debug.CompositeItem): Pixi.Container {
    const container = new Pixi.Container();
    container.sortableChildren = true;
    container.zIndex = item.zIndex;
    //const pos = params?.offset ? item.basePosition.plus(params.offset) : item.basePosition;
    const pos = item.position;
    if (pos) {
      const [x, y] = pos.toCartesian(this.boardScale);
      container.x = x;
      container.y = y;
    }
    item.components.forEach((component) => {
      const renderedItem = this.renderItem(component);
      if (renderedItem) {
        container.addChild(renderedItem);
      }
    });

    return container;
  }

  renderPositionedText(item: debug.PositionedText): Pixi.Text {
    const style = {
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fill: item.color
    };
    const text = new Pixi.Text(item.text, style);
    text.zIndex = item.zIndex;
    const [x, y] = item.position.toCartesian(this.boardScale);
    text.x = x;
    text.y = y;
    return text;
  }

  renderArrow(item: debug.Arrow): Pixi.Container {
    const container = new Pixi.Container();
    const [dx, dy] = item.end.minus(item.start).toCartesian(this.boardScale);
    const len = sqrt((dx * dx) + (dy * dy));
    const cosAngle = dx / len;
    const t = acos(cosAngle);
    const rotation = (dy > 0 ? t : (2 * PI) - t) + (PI / 2);

    const startSprite = new Pixi.Sprite(this.resources["arrows"].textures!["arrow-lg-start"]);
    startSprite.tint = item.color;
    startSprite.rotation = rotation;
    startSprite.anchor.x = 0.5;
    startSprite.anchor.y = 0.5;
    const [x1, y1] = item.start.toCartesian(this.boardScale);
    startSprite.x = x1;
    startSprite.y = y1;

    const endSprite = new Pixi.Sprite(this.resources["arrows"].textures!["arrow-lg-end"]);
    endSprite.tint = item.color;
    endSprite.rotation = rotation;
    endSprite.anchor.x = 0.5;
    endSprite.anchor.y = 0.5;
    const [x2, y2] = item.end.toCartesian(this.boardScale);
    endSprite.x = x2;
    endSprite.y = y2;

    const midSprite = new Pixi.TilingSprite(this.resources["arrows"].textures!["arrow-lg-mid"]);
    midSprite.tint = item.color;
    midSprite.rotation = rotation;
    midSprite.anchor.x = 0.5;
    midSprite.anchor.y = 0.5;
    const x3 = (x1 + x2) / 2;
    const y3 = (y1 + y2) / 2;
    midSprite.x = x3;
    midSprite.y = y3;
    const midLen = len - 30;
    const s = midLen / 32;
    midSprite.width = 32;
    midSprite.height = midLen;

    container.addChild(startSprite);
    container.addChild(endSprite);
    container.addChild(midSprite);

    return container;
  }

  renderItem(item: debug.DebugItem): Pixi.DisplayObject | undefined {
    if (debug.isLabeledHexagon(item)) {
      return this.renderLabeledHexagon(item);
    } else if (debug.isCompositeItem(item)) {
      return this.renderCompositeItem(item);
    } else if (debug.isPositionedText(item)) {
      return this.renderPositionedText(item);
    } else if (debug.isArrow(item)) {
      return this.renderArrow(item);
    } else {
      log.error(`DebugDisplay.renderItem: don't know how to render type ${item.itemType}`);
      return undefined;
    }
  }

  refresh() {
    try {
      const strings: string[] = [(new Date()).toString()];
      this.textEntries.forEach((val, key) => {
        strings.push(`${key}: ${val}`);
      });

      this.renderedText.text = strings.join("\n");
    } catch (err) {
      log.error(`DebugDisplay.refresh: ${err}`);
    }
  }
}
