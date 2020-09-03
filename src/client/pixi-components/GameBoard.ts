import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { log } from "~shared/log";
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
  private resources: Record<string, Pixi.LoaderResource>;
  private origin: { x: number, y: number };
  private boardScale: number;
  private textures: { [name: string]: Pixi.Texture };
  private tileSprites: Pixi.Sprite[][];
  private renderedEntityContainer: RenderedEntityContainer;
  private mySpaceshipId: string;

  constructor(
    resources: Record<string, Pixi.LoaderResource>,
    viewport: Viewport,
    config: GameBoardConfig
  ) {
    this.resources = resources;
    this.viewport = viewport;
    this.origin = config.origin;
    this.boardScale = config.boardScale;

    const hexagons = resources["hexagons"].textures;
    this.textures = {
      "hexagon": hexagons["hexagon"],
      "hexagon-outline": hexagons["hexagon-outline"],
      "hexagon-dark": hexagons["hexagon-dark"],
      "hexagon-dark-outline": hexagons["hexagon-dark-outline"],
      "hexagon-light": hexagons["hexagon-light"],
      "hexagon-light-outline": hexagons["hexagon-light-outline"],
    };

    const tiles = HexVector.tile2D(
      20, // TODO: factor out tilesWidth, tilesHeight
      20, 
      HexVector.direction("x-z").times(this.boardScale),
      HexVector.direction("y-z").times(this.boardScale)
    );

    const containerParams = {
      boardScale: this.boardScale
    }

    this.renderedEntityContainer = new RenderedEntityContainer(this.resources, containerParams);

    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    //this.container.x = -500;
    //this.container.y = -300;
    this.container.addChild(this.renderedEntityContainer.container);

    this.tileSprites = tiles.map((row, i) => row.map((tile, j) => {
      const [x, y] = tile.toCartesian(1);
      const sprite = new Pixi.Sprite(this.textures["hexagon-dark"]);
      sprite.x = x;
      sprite.y = y;
      sprite.scale.x = 0.2;
      sprite.scale.y = 0.2;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      sprite.zIndex = 0;
      //sprite.visible = false; // TODO: AAAAHHHH!
      this.container.addChild(sprite);
      return sprite;
    }));
  }

  refresh() {
    this.renderedEntityContainer.refresh();
  }

  onTurnEnd = (events: event.GameEvent[]) => {
    this.refresh();
    const spaceship = this.renderedEntityContainer.getEntity(this.mySpaceshipId);
    const { x, y } = spaceship?.sprite?.position ?? { x: 0, y: 0 };
    const snapOptions = {
      ease: "easeInOutSine"
    };
    this.viewport.snap(x, y, snapOptions);
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

  onEntityRemoved = (entity: GameEntity) => {
    this.renderedEntityContainer.removeEntityById(entity.id);
  }

  //addEntity(entity: PositionEntity & RotationEntity) {
  //  this.gameState.addEntity(entity);
  //  this.renderedEntityContainer.addEntity(entity);
  //}

  initializeGameState(mySpaceshipId: string, entityData: object[]) {
    this.renderedEntityContainer.removeAll();
    this.mySpaceshipId = mySpaceshipId; // TODO: don't need this. add method to center view on any entity
    this.gameState = GameState.fromEntityData(entityData);
    this.gameState.entities.forEach((entity) => {
      if (hasPosition(entity) && hasRotation(entity)) {
        const zIndex = 10;
        this.renderedEntityContainer.addEntity(entity, zIndex);
      }
    });

    this.gameState.listeners.onTurnEnd = this.onTurnEnd;
    this.gameState.listeners.onEntityMoved = this.onEntityMoved;
    this.gameState.listeners.onEntitySpawned = this.onEntitySpawned;
    this.gameState.listeners.onEntityRemoved = this.onEntityRemoved;

    this.renderedEntityContainer.refresh();
  }

  highlightHex(x: number, y: number) {
    this.tileSprites.forEach((row, i) => {
      row.forEach((sprite, j) => {
        if (! (j == x && i == y)) {
          sprite.texture = this.textures["hexagon-dark"];
        } else {
          sprite.texture = this.textures["hexagon"];
        }
      });
    });
  }
}
