import * as Pixi from "pixi.js";
import { log } from "~shared/log";
import { GameClient } from "~client/GameClient";
import {
  HexVector,
  HexDirection,
  HEX_DIRECTIONS,
  PlayerRole,
  Spaceship,
  AccelerateSelf
} from "~shared/model";

export interface VisualControlsConfig {
  maxAcceleration: number;
}

export interface VisualControlsOutput {
  acceleration?: HexVector;
  shooting?: HexVector;
}

export class VisualControls {
  // TODO: this WHOLE class is placeholder crap
  spaceship: Spaceship;
  config: VisualControlsConfig;
  container: Pixi.Container;
  private client: GameClient;
  private resources: Record<string, Pixi.LoaderResource>;
  private accelControlsContainer: Pixi.Container;
  private shootControlsContainer: Pixi.Container;
  private accelSprites: Pixi.Sprite[];
  private shootSprites: Pixi.Sprite[];
  private centerViewButton: Pixi.Sprite;
  private changeHandlers: ((output: VisualControlsOutput) => void)[];

  private acceleration: {
    direction: HexDirection,
    value: number
  } = {
    direction: HEX_DIRECTIONS[0],
    value: 0
  };

  private shooting: {
    direction: HexDirection | null
  } = {
    direction: null
  };

  private decelerating: boolean = true;

  constructor(resources: Record<string, Pixi.LoaderResource>, client: GameClient, config: VisualControlsConfig) {
    this.client = client;
    this.resources = resources;
    this.container = new Pixi.Container();
    this.accelControlsContainer = new Pixi.Container();
    this.shootControlsContainer = new Pixi.Container();
    this.accelSprites = [];
    this.shootSprites = [];
    this.shootControlsContainer.x = -150;
    this.container.zIndex = 10;
    this.container.interactiveChildren = true;
    this.accelControlsContainer.interactiveChildren = true;
    this.shootControlsContainer.interactiveChildren = true;
    this.config = config;
    this.changeHandlers = [];

    HEX_DIRECTIONS.forEach((dir) => {
      const v = HexVector.direction(dir);
      const accelSprite = new Pixi.Sprite(this.resources["hexagons"].textures!["hexagon-light"]);
      const [x, y] = v.toCartesian(30);
      accelSprite.anchor.x = 0.5;
      accelSprite.anchor.y = 0.5;
      accelSprite.x = x;
      accelSprite.y = y;
      accelSprite.scale.x = 0.3;
      accelSprite.scale.y = 0.3;
      accelSprite.interactive = true;
      accelSprite.on("mousedown", () => {
        this.incrementAcceleration(dir);
      });

      this.accelControlsContainer.addChild(accelSprite);
      this.accelSprites.push(accelSprite);

      const shootSprite = new Pixi.Sprite(this.resources["hexagons"].textures!["hexagon-light"]);
      shootSprite.anchor.x = 0.5;
      shootSprite.anchor.y = 0.5;
      shootSprite.x = x;
      shootSprite.y = y;
      shootSprite.scale.x = 0.2;
      shootSprite.scale.y = 0.2;
      shootSprite.tint = 0xff3333;
      shootSprite.interactive = true;
      shootSprite.on("mousedown", () => {
        this.toggleShooting(dir);
      });

      this.shootControlsContainer.addChild(shootSprite);
      this.shootSprites.push(shootSprite);
    });

    this.centerViewButton = new Pixi.Sprite(this.resources["hexagons"].textures!["hexagon-light"]);
    this.centerViewButton.anchor.x = 0.5;
    this.centerViewButton.anchor.y = 0.5;
    this.centerViewButton.x = -300;
    this.centerViewButton.scale.x = 0.3;
    this.centerViewButton.scale.y = 0.3;
    this.centerViewButton.interactive = true;
    this.centerViewButton.on("mousedown", () => {
      this.client.centerMySpaceship();
    });

    this.container.addChild(this.accelControlsContainer);
    this.container.addChild(this.shootControlsContainer);
    this.container.addChild(this.centerViewButton);

    this.onWindowResize();
  }

  addHandler(handler: ((output: VisualControlsOutput) => void)) {
    this.changeHandlers.push(handler);
  }

  refresh() {
    HEX_DIRECTIONS.forEach((dir, i) => {
      const accelSprite = this.accelSprites[i];
      if (this.acceleration.value != 0 && dir == this.acceleration.direction) {
        accelSprite.tint = 0xff1111 * (this.acceleration.value / 3); // lol who knows what color this is picking
      } else {
        accelSprite.tint = 0xffffff;
      }
    });
  }

  getOutput(): VisualControlsOutput {
    let acceleration: HexVector;
    if (this.decelerating && this.spaceship) {
      // TODO: revise to produce more "natural" deceleration paths
      const mag = this.spaceship.velocity.gridMagnitude();
      acceleration = this.spaceship.velocity.cubicLerp(HexVector.ZERO, 1 / mag);
    } else {
      acceleration = HexVector.direction(this.acceleration.direction).times(this.acceleration.value);
    }

    let shooting = this.shooting.direction ? HexVector.direction(this.shooting.direction) : undefined;

    return {
      acceleration,
      shooting
    };
  }

  incrementAcceleration(inDirection: HexDirection) {
    this.decelerating = false;
    const { direction, value } = this.acceleration;
    if (inDirection == direction) {
      if (this.config.maxAcceleration) {
        this.acceleration = { direction, value: (value + 1) % (this.config.maxAcceleration + 1) };
      } else {
        this.acceleration = { direction, value: value + 1 };
      }
    } else {
      this.acceleration = { direction: inDirection, value: 1 };
    }

    this.refresh();
    this.changeHandlers.forEach(handler => handler(this.getOutput()));
  }

  toggleShooting(inDirection: HexDirection) {
    const { direction } = this.shooting;
    this.shooting.direction = (direction == inDirection) ? null : inDirection;
    this.refresh();
    this?.changeHandlers?.forEach(handler => handler(this.getOutput()));
  }

  setDecelerating() {
    this.acceleration.value = 0;
    this.decelerating = true;
  }

  setSpaceship(spaceship: Spaceship) {
    this.spaceship = spaceship;
  }

  onWindowResize = () => {
    this.container.x = window.innerWidth - 100;
    this.container.y = window.innerHeight - 100;
  }
}
