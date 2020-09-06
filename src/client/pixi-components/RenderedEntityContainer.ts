import * as Pixi from "pixi.js";
import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import {
  GameEntity,
  HexVector,
  PositionEntity,
  RotationEntity
} from "~shared/model";

import { RenderedEntity } from "./RenderedEntity";

export interface RenderedEntityContainerConfig {
  boardScale?: number;
}

export class RenderedEntityContainer {
  container: Pixi.Container;
  private resources: Record<string, Pixi.LoaderResource>;
  private renderedEntitiesById: Map<string, RenderedEntity>;
  private boardScale: number;

  constructor(resources: Record<string, Pixi.LoaderResource>, config: RenderedEntityContainerConfig) {
    this.boardScale = config?.boardScale ?? 1;
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.container.zIndex = 1;
    this.resources = resources;
    this.renderedEntitiesById = new Map();
  }

  addEntity(entity: PositionEntity & RotationEntity, zIndex: number) {
    if (this.renderedEntitiesById.get(entity.id)) {
      throw new Error(`RenderedEntityContainer already has entity with id ${entity.id}`);
    }

    let texture: Pixi.Texture;
    if (entity.spriteName) {
      if (entity.spritesheetName) {
        texture = this.resources[entity.spritesheetName].textures![entity.spriteName];
      } else {
        texture = this.resources[entity.spriteName].texture;
      }
    } else {
      throw new Error(`tried to render entity ${idtrim(entity.id)} with no spriteName`);
    }

    const sprite = new Pixi.Sprite(texture);
    sprite.zIndex = zIndex;

    const params = {
      boardScale: this.boardScale
    };
    const renderedEntity = new RenderedEntity(entity, sprite, params);

    this.renderedEntitiesById.set(entity.id, renderedEntity);
    this.container.addChild(renderedEntity.sprite);
  }

  getEntity(id: string): RenderedEntity | undefined {
    return this.renderedEntitiesById.get(id);
  }

  removeAll() {
    // TODO: is this really the right way to remove a lot of entities?
    // well, yes, if there's something that has to happen on removing each one
    this.renderedEntitiesById.forEach((_, id) => {
      this.removeEntityById(id);
    });
  }

  removeEntity(renderedEntity: RenderedEntity): RenderedEntity | undefined {
    return this.removeEntityById(renderedEntity.entity.id);
  }

  removeEntityById(id: string): RenderedEntity | undefined {
    const e = this.renderedEntitiesById.get(id);
    if (e) {
      this.container.removeChild(e.sprite);
      this.renderedEntitiesById.delete(id);
    }

    return e;
  }

  refresh() {
    //log.info(`refresh`);
    //this.renderedEntitiesById.forEach((re) => {
    //  log.info(JSON.stringify(re.entity, null, 2));
    //});
    this.renderedEntitiesById.forEach((renderedEntity) => {
      renderedEntity.refreshSprite();
    });
  }
}
