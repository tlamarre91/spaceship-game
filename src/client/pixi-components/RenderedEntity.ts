import * as Pixi from "pixi.js";
import { log } from "~shared/log";
import {
  GameEntity,
  HexVector,
  PositionEntity,
  RotationEntity
} from "~shared/model";

export interface RenderedEntityParams {
  boardScale?: number;

  scale?: {
    x: number,
    y: number
  };

  anchor?: {
    x: number,
    y: number
  };

  zIndex?: number;
};

export class RenderedEntity {
  entity: PositionEntity & RotationEntity;
  sprite: Pixi.Sprite;
  boardScale: number; // TODO: can this just live in RenderedEntityContainer or above and get passed?

  constructor(entity: PositionEntity & RotationEntity, sprite: Pixi.Sprite, params?: RenderedEntityParams) {
    this.entity = entity;
    this.sprite = sprite;

    this.boardScale = params?.boardScale  ?? 1;

    this.sprite.scale.x = entity.spriteScale * (params?.scale?.x ?? 1);
    this.sprite.scale.y = entity.spriteScale * (params?.scale?.y ?? 1);

    this.sprite.zIndex = params?.zIndex ?? 2;

    if (params?.anchor) {
      const a = params.anchor;
      this.sprite.anchor.x = a.x;
      this.sprite.anchor.y = a.y;
    } else {
      this.sprite.anchor.x = 0.5;
      this.sprite.anchor.y = 0.5;
    }

    this.refreshSprite();
  }

  refreshSprite() {
    // TODO: method for "invalidating" a rendered entity in order to get it redrawn.
    //  do not redraw if not invalidated
    const [x, y] = this.entity.position.toCartesian(this.boardScale);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.rotation = this.entity.rotation;
  }
}
