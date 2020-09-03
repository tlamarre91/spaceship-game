import { log } from "~shared/log";
export class Keybind {
  value: string;
  debug: boolean;
  isDown: boolean;
  isUp: boolean;
  onPress?: () => void;
  onRelease?: () => void;

  constructor(value: string, onPress?: () => void, onRelease?: () => void, debug?: boolean) {
    this.value = value;
    this.debug = debug;
    this.onPress = onPress;
    this.onRelease = onRelease;
  }

  downHandler(event: KeyboardEvent) {
    if (event.key == this.value) {
      if (this.isUp) this?.onPress();
      this.isUp = false;
      this.isDown = true;
      event.preventDefault();
    }
  }

  upHandler(event: KeyboardEvent) {
    if (event.key == this.value) {
      if (this.isDown) this?.onRelease();
      this.isDown = false;
      this.isUp = true;
      event.preventDefault();
    }
  }

  activate() {
    window.addEventListener("keydown", this.downHandler, false);
    window.addEventListener("keyup", this.upHandler, false);
  }

  deactivate() {
    window.removeEventListener("keydown", this.downHandler);
    window.removeEventListener("keyup", this.upHandler);
  }
}

export type Keymap = {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  fire: string;
}

export interface PlayerController {
  horizontalMoveOutput(): number;
  verticalMoveOutput(): number;
}

export class MouseKeyboardController {
  keymap: Keymap;
  keyHandlers: Map<keyof Keymap, Keybind>;
  constructor(keymap: Keymap) {
    this.keymap = keymap;
    this.keyHandlers = new Map();
    this.keyHandlers.set("moveUp", new Keybind(this.keymap.moveUp));
    this.keyHandlers.set("moveDown", new Keybind(this.keymap.moveDown));
    this.keyHandlers.set("moveLeft", new Keybind(this.keymap.moveLeft));
    this.keyHandlers.set("moveRight", new Keybind(this.keymap.moveRight));
  }

  horizontalMoveOutput(): number {
    if (this.keyHandlers.get("moveLeft").isDown) {
      if (this.keyHandlers.get("moveRight").isDown) {
        return 0;
      } else {
        return -1;
      }
    } else if (this.keyHandlers.get("moveRight").isDown) {
      return 1;
    }
  }

  verticalMoveOutput(): number {
    if (this.keyHandlers.get("moveUp").isDown) {
      if (this.keyHandlers.get("moveDown").isDown) {
        return 0;
      } else {
        return 1;
      }
    } else if (this.keyHandlers.get("moveDown").isDown) {
      return -1;
    }
  }

  activate() {
    this.keyHandlers.forEach((handler) => handler.activate());
  }

  deactivate() {
    this.keyHandlers.forEach((handler) => handler.deactivate());
  }
}
