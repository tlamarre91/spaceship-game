import * as Pixi from "pixi.js";

import { log } from "~shared/log";

export class VisualDebug {
  renderedText: Pixi.Text;
  private debugEntries: Map<string, string>;
  private STYLE = {
    fontFamily: "Arial",
    fontSize: 12,
    fill: 0xffffff
  };

  constructor() {
    this.renderedText = new Pixi.Text("", this.STYLE);
    this.debugEntries = new Map();
  }

  setEntry(key: string, val: string) {
    this.debugEntries.set(key, val);
  }

  removeEntry(key: string) {
    this.debugEntries.delete(key);
  }

  refresh() {
    try {
      const debug: string[] = [(new Date()).toString()];
      this.debugEntries.forEach((val, key) => {
        debug.push(`${key}: ${val}`);
      });

      this.renderedText.text = debug.join("\n");
    } catch (err) {
      log.info(`refreshDebug: ${err}`);
    }
  }
}
