import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { log } from "~shared/log";
import * as debug from "~shared/model/VisualDebugItem";
import {
  HexVector,
  HexSegment
} from "~shared/model";

export interface VisualDebugConfig {
  boardScale: number;
}

interface RenderParams {
  offset: HexVector;
}

export class VisualDebug {
  private resources: Record<string, Pixi.LoaderResource>;
  //viewport: Viewport;
  private TEXT_STYLE = {
    fontFamily: "Arial",
    fontSize: 12,
    fill: 0xffffff
  };
  renderedText: Pixi.Text = new Pixi.Text("", this.TEXT_STYLE);
  viewportContainer: Pixi.Container;
  private textEntries: Map<string, string> = new Map();
  private renderedItems: Map<string, Pixi.Container> = new Map();
  private boardScale: number;

  constructor(resources: Record<string, Pixi.LoaderResource>, config: VisualDebugConfig) {
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

  setVisualItem(key: string, item: debug.VisualDebugItem) {
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

  removeVisualItem(key: string) {
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

  renderLabeledHexagon(item: debug.LabeledHexagon, params: Partial<RenderParams> = {}): Pixi.Container {
    const sprite = new Pixi.Sprite(this.resources["hexagons"].textures![item.spriteName]);
    sprite.tint = item.tint;
    sprite.alpha = item.alpha;
    sprite.scale.x = item.scale;
    sprite.scale.y = item.scale;
    sprite.zIndex = 3;
    const renderedText = new Pixi.Text(item.text, this.TEXT_STYLE);
    renderedText.zIndex = 4;
    const container = new Pixi.Container();
    const pos = params?.offset ? item.position.plus(params.offset) : item.position
    const [x, y] = pos.toCartesian(this.boardScale);
    container.x = x;
    container.y = y;
    container.addChild(sprite);
    container.addChild(renderedText);
    return container;
  }

  renderCompositeItem(item: debug.CompositeItem, params: Partial<RenderParams> = {}): Pixi.Container {
    const container = new Pixi.Container();
    //const pos = params?.offset ? item.basePosition.plus(params.offset) : item.basePosition;
    const pos = item.basePosition
    if (pos) {
      const [x, y] = pos.toCartesian(this.boardScale);
      container.x = x;
      container.y = y;
    }
    item.components.forEach((component) => {
      const renderedItem = this.renderItem(component, params);
      if (renderedItem) {
        container.addChild(renderedItem);
      }
    });

    return container;
  }

  renderItem(item: debug.VisualDebugItem, params: Partial<RenderParams> = {}): Pixi.Container | undefined{
    if (debug.isLabeledHexagon(item)) {
      return this.renderLabeledHexagon(item, params);
    } else if (debug.isCompositeItem(item)) {
      return this.renderCompositeItem(item);
    } else {
      log.warn(`VisualDebug.renderItem: don't know how to render type ${item.itemType}`);
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
      log.error(`VisualDebug.refresh: ${err}`);
    }
  }
}
