import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { log } from "~shared/log";
import {
  rowColumnFromIndex
} from "~shared/util";
import {
  GameEntity,
  GameState,
  HexVector,
  PositionEntity,
  RotationEntity,
  hasPosition,
  hasRotation,
} from "~shared/model";

import { RenderedEntityContainer } from "./RenderedEntityContainer";

import * as event from "~shared/model/GameEvent";

export interface GameBoardConfig {
  origin: { x: number, y: number };
  boardScale: number;
}

export class GameBoard {
  container: Pixi.Container;
  gameState: GameState;
  private viewport: Viewport;
  private resources: Record<string, Pixi.ILoaderResource>;
  private origin: { x: number, y: number };
  private boardScale: number;
  height: number = 20;
  width: number = 20;
  private textures: { [name: string]: Pixi.Texture };
  private tileSprites: Pixi.Sprite[];
  private renderedEntityContainer: RenderedEntityContainer;
  private mySpaceshipId: string;

  constructor(
    resources: Record<string, Pixi.ILoaderResource>,
    viewport: Viewport,
    config: GameBoardConfig
  ) {
    this.resources = resources;
    this.viewport = viewport;
    this.origin = config.origin;
    this.boardScale = config.boardScale;

    const hexagons = resources["hexagons"].textures!;
    this.textures = {
      "hexagon": hexagons["hexagon"],
      "hexagon-outline": hexagons["hexagon-outline"],
      "hexagon-dark": hexagons["hexagon-dark"],
      "hexagon-dark-outline": hexagons["hexagon-dark-outline"],
      "hexagon-light": hexagons["hexagon-light"],
      "hexagon-light-outline": hexagons["hexagon-light-outline"],
    };

    const tiles = HexVector.tile2D(
      this.height,
      this.width, 
      HexVector.direction("x-z").times(this.boardScale),
      HexVector.direction("y-z").times(this.boardScale)
    );

    const containerParams = {
      boardScale: this.boardScale
    }

    this.renderedEntityContainer = new RenderedEntityContainer(this.resources, containerParams);

    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.container.addChild(this.renderedEntityContainer.container);

    this.tileSprites = tiles.map((tile) => {
      const [x, y] = tile.toCartesian(1);
      const sprite = new Pixi.Sprite(this.textures["hexagon-dark"]);
      sprite.x = x;
      sprite.y = y;
      sprite.scale.x = 0.2;
      sprite.scale.y = 0.2;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      sprite.zIndex = 0;
      sprite.on("click", () => { console.log([x, y]) });
      //sprite.visible = false; // TODO: AAAAHHHH!
      this.container.addChild(sprite);
      return sprite;
    });
  }

  setGameState(gameState: GameState) {
    this.gameState = gameState;
  }

  refresh() {
    this.renderedEntityContainer.refresh();
  }

  snapToEntity(id: string) {
    const ent = this.gameState?.getEntity(id);
    if (ent && hasPosition(ent)) {
      const [x, y] = ent.position.toCartesian(this.boardScale);
      const snapOptions = {
        ease: "easeInOutSine",
        interrupt: true,
        removeOnComplete: true
      }

      this.viewport.snap(x, y, snapOptions);
    }
  }

  onTurnEnd = (events: event.GameEvent[]) => {
    this.refresh();
  }

  onEntityMoved = (entity: GameEntity) => {
    // TODO: handle animation
  }

  onEntitySpawned = (entity: GameEntity) => {
    if (hasPosition(entity) && hasRotation(entity)) {
      const zIndex = 10;
      this.renderedEntityContainer.addEntity(entity, zIndex);
    }
  }

  onEntityRemoved = (entityId: string) => {
    this.renderedEntityContainer.removeEntityById(entityId);
  }

  setListeners() {
    if (this.gameState?.listeners) {
      this.gameState.listeners.onTurnEnd = this.onTurnEnd;
      this.gameState.listeners.onEntityMoved = this.onEntityMoved;
      this.gameState.listeners.onEntitySpawned = this.onEntitySpawned;
      this.gameState.listeners.onEntityRemoved = this.onEntityRemoved;
    }
  }

  //addEntity(entity: PositionEntity & RotationEntity) {
  //  this.gameState.addEntity(entity);
  //  this.renderedEntityContainer.addEntity(entity);
  //}

  // initializeGameState(entityData: object[]) {
  //   this.renderedEntityContainer.removeAll();
  //   this.gameState = GameState.fromEntityData(entityData);
  //   this.gameState.entities.forEach((entity) => {
  //     if (hasPosition(entity) && hasRotation(entity)) {
  //       const zIndex = 10;
  //       this.renderedEntityContainer.addEntity(entity, zIndex);
  //     }
  //   });

  //   this.gameState.listeners.onTurnEnd = this.onTurnEnd;
  //   this.gameState.listeners.onEntityMoved = this.onEntityMoved;
  //   this.gameState.listeners.onEntitySpawned = this.onEntitySpawned;
  //   this.gameState.listeners.onEntityRemoved = this.onEntityRemoved;

  //   this.renderedEntityContainer.refresh();
  // }

  highlightHex(x: number, y: number) {
    this.tileSprites.forEach((sprite, index) => {
      const [row, col] = rowColumnFromIndex(index, this.width);
      if (col == x && row == y) {
        sprite.texture = this.textures["hexagon"];
      } else {
        sprite.texture = this.textures["hexagon-dark"];
      }
    });
    //this.tileSprites.forEach((row, i) => {
    //  row.forEach((sprite, j) => {
    //    if (! (j == x && i == y)) {
    //      sprite.texture = this.textures["hexagon-dark"];
    //    } else {
    //      sprite.texture = this.textures["hexagon"];
    //    }
    //  });
    //});
  }

  addEntity(entity: PositionEntity & RotationEntity, zIndex: number) {
    this.renderedEntityContainer.addEntity(entity, zIndex);
  }
}
