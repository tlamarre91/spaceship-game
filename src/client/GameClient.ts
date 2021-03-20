import { v4 as uuid } from "uuid";
import { io, Socket } from "socket.io-client";
import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { log } from "~shared/log";
import {
  lerp,
  idtrim
} from "~shared/util";

import {
  GameEntity,
  GameState,
  HexVector,
  PositionEntity,
  RotationEntity,
  hasPosition,
  hasRotation,
  HEX_DIRECTIONS,
  PlayerRole,
} from "~shared/model";
import * as net from "~shared/net";
import * as debug from "~shared/model/DebugItem";

import {
  GameBoard,
  TurnClock,
  Controls,
  ControlsOutput,
  DebugDisplay
} from "./pixi-components";

import * as action from "~shared/model/GameAction";

export interface GameClientFlags {
  paused: boolean;
  debug: boolean;
}

export interface GameClientComponents {
  board: GameBoard;
  clock: TurnClock;
  controls: Controls;
  debugDiaplay: DebugDisplay;
  //entityContainer: RenderedEntityContainer;
}

export class GameClient {
  clientId: string;
  pixiApp: Pixi.Application;
  //private socket: Socket = {} as Socket;
  private socket: Socket;

  private headless: boolean;
  private gameState: GameState;
  private loader: Pixi.Loader;
  private resources: Record<string, Pixi.LoaderResource>;
  private viewport: Viewport;
  private flags: GameClientFlags = {
    paused: false,
    debug: true
  };
  private components: GameClientComponents;
  averagePing: number = 0;
  private lastPingTime: number;
  private lastPongTime: number;
  mySpaceshipId: string;

  private readonly PING_SAMPLES = 5;
  private readonly DEBUG_PER_SECOND = 10;
  private readonly CONTROLS_TIMEOUT = 500;

  private sendActionsTimeout: NodeJS.Timeout;

  constructor(
    pixiApp?: Pixi.Application,
    loader?: Pixi.Loader,
    resources?: Record<string, Pixi.LoaderResource>
  ) {
    this.clientId = uuid();
    log.info(`initializing client ${idtrim(this.clientId)}`);
    if (pixiApp !== undefined && loader !== undefined && resources !== undefined) {
      this.headless = false;
      this.pixiApp = pixiApp;
      this.loader = loader;
      this.resources = resources;

      this.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 3000,
        worldHeight: 3000,
        interaction: pixiApp.renderer.plugins.interaction
      });

      this.pixiApp.stage.addChild(this.viewport);

      this.viewport
        .animate({
          time: 200
        })
        .drag()
      //.pinch()
      //.decelerate()
        .wheel();
    } else {
      this.headless = true;
      log.info("initializing headless client");
    }
  }

  initializeGameState(entityData: object[]) {
    this.gameState = GameState.fromEntityData(entityData);
    this.gameState.entities.forEach((entity) => {
      if (hasPosition(entity) && hasRotation(entity)) {
        const zIndex = 10;
        this.components?.board.addEntity(entity, zIndex);
      }
    });

    this.components?.board.setGameState(this.gameState);
    this.components?.board.setListeners();
    this.components?.board.refresh();
  }

  centerMySpaceship() {
    this.components?.board.snapToEntity(this.mySpaceshipId);
  }

  setFlags(flags: Partial<GameClientFlags>) {
    this.flags = {
      paused: flags?.paused ?? this.flags.paused,
      debug: flags?.debug ?? this.flags.debug
    }
  }

  getFlag(flag: keyof GameClientFlags) {
    return this.flags[flag];
  }

  sendPing() {
    this.lastPingTime = Date.now();
    this.socket.emit(net.GamePing.event);
  }

  onWindowResize = () => {
    this.pixiApp?.renderer.resize(window.innerWidth, window.innerHeight);
    this.components?.controls?.onWindowResize();
    this.components?.clock?.onWindowResize();
  }
  
  onConnect = () => {
    //log.info(`client ${idtrim(this.clientId)} sending Join`);
    const join = new net.Join(this.clientId);
    this.socket.emit(net.Join.event, join);
  };

  onPong = () => {
    this.lastPongTime = Date.now();
    this.averagePing = this.lastPongTime - this.lastPingTime;
    this.components?.debugDiaplay.setTextEntry("ping", this.averagePing.toString());
  }

  onInitializeGameState = (msg: net.InitializeGameState) => {
    const {
      yourShipId,
      entityData
    } = msg;

    this.mySpaceshipId = yourShipId;
    this.components?.debugDiaplay.setTextEntry("my ship id", idtrim(yourShipId));
    this.initializeGameState(entityData);
  }

  onTurnStart = (msg: net.TurnStart) => {
    this.components?.clock.restart();
    this.sendActionQueues();
  }

  //onTurnWarn = (msg: net.TurnWarn) => {
  //  this.sendActionQueues();
  //}

  onControlsChange = (output: ControlsOutput) => {
    log.info("ONCHANGE");
    clearTimeout(this.sendActionsTimeout);
    this.sendActionsTimeout = setTimeout(this.sendActionQueues, this.CONTROLS_TIMEOUT);
  }

  onTurnEnd = (msg: net.TurnEnd) => {
    const {
      turnEvents,
      currentPosition
    } = msg;

    // TODO: ew! sorta spaghetti
    this.components?.board?.gameState?.setEventQueue(turnEvents);
    this.components?.board?.gameState?.passTurn();
  }

  sendActionQueues = () => {
    const controlsOutput = this.components?.controls.getOutput();
    let roleActionTuples: [PlayerRole, action.GameAction[]][] = [];
    if (controlsOutput?.acceleration) {
      const accel = new action.AccelerateSelf(controlsOutput.acceleration);
      roleActionTuples.push(["n", [accel]]);
    }
    const shootVector = controlsOutput?.shooting;
    if (shootVector) {
      const shoot = new action.SpawnProjectile(shootVector);
      roleActionTuples.push(["w", [shoot]]);
    }
    const msg = new net.SetMultipleActionQueues(roleActionTuples);
    log.info(`sending action queues: ${JSON.stringify(msg, null, 2)}`);
    this.socket.emit(net.SetMultipleActionQueues.event, msg);
  }

  clearStage() {
    this.viewport.removeChildren();
    const bg = new Pixi.Sprite(this.resources["bg"].texture);
    bg.x = 0;
    bg.y = 0;

    this.viewport.addChild(bg);
    if (this.flags.debug) {
      this.components?.debugDiaplay.refresh();
    }
  }

  frame = 0;

  tick = () => {
    if (0 == this.frame) {
      const [x, y] = [Math.floor(Math.random() * 25), Math.floor(Math.random() * 25)];
      this.components?.board.highlightHex(x, y);
      this.components?.board.refresh();
    }

    this.components?.clock.refresh();

    this.frame = (this.frame + 1) % 60;
    if (0 == this.frame) {
      this.components?.debugDiaplay.refresh();
    }

    //const arrows: debug.DebugItem[] = [];

    HEX_DIRECTIONS.forEach((dirName, index) => {
      const dir = HexVector.direction(dirName);
      const start = dir;
      const end = dir.times(this.frame / 5);

      //arrows.push(new debug.Arrow({
      //  start,
      //  end,
      //  color: 0x5555ff
      //}));

      //arrows.push(new debug.Arrow({
      //  start: end,
      //  end: end.plus(HexVector.direction(HEX_DIRECTIONS[(index + 1) % 6]).times(this.frame / 5)),
      //  color: 0xff5555
      //}));
    });

    //this.components?.debugDiaplay.setItem("arrows", new debug.CompositeItem({
    //  components: arrows
    //}));
  }

  setupComponents() {
    const boardScale = 30;
    const boardConfig = {
      origin: {
        x: this.viewport.width / 2,
        y: this.viewport.height / 2
      },
      boardScale,
    };

    const controlsConfig = {
      maxAcceleration: 3
    };

    const clockConfig = {
      maxTimeMs: 5000,
      width: 500,
      height: 10
    };

    const debugConfig = {
      boardScale
    }

    this.components = {
      board: new GameBoard(this.resources, this.viewport, boardConfig),
      clock: new TurnClock(this.resources, clockConfig),
      controls: new Controls(this.resources, this, controlsConfig),
      debugDiaplay: new DebugDisplay(this.resources, debugConfig),
    };

    this.components.controls.addHandler(this.onControlsChange);
    this.components.debugDiaplay.setTextEntry("clientId", idtrim(this.clientId));

    //this.viewport.removeChildren();
    this.pixiApp.stage.addChild(this.components.clock.container);
    this.pixiApp.stage.addChild(this.components.controls.container);
    this.pixiApp.stage.addChild(this.components.debugDiaplay.renderedText);
    this.viewport.addChild(this.components.board.container);
    this.viewport.addChild(this.components.debugDiaplay.viewportContainer);
  }

  setupSocket() {
    this.socket = io("http://localhost:3000"); // arg can be omitted to use window.location
    this.socket.on("connect", this.onConnect);
    //this.socket.on(net.TurnWarn.event, this.onTurnWarn);
    this.socket.on(net.GamePong.event, this.onPong);
    this.socket.on(net.TurnStart.event, this.onTurnStart);
    this.socket.on(net.TurnEnd.event, this.onTurnEnd);
    this.socket.on(net.InitializeGameState.event, this.onInitializeGameState);
  }

  start() {
    this.setupSocket();
    if (!this.headless) {
      this.setupComponents();
      this.pixiApp.ticker.add(this.tick);
      this.testDebug();
    }
  }

  testDebug() {
    const components: debug.DebugItem[] = [
      //new debug.LabeledHexagon("butts", {
      //  position: HexVector.ZERO,
      //  scale: 0.5,
      //  spriteName: "hexagon-light"
      //}),
      //new debug.PositionedText("BIG BUTTS", {
      //  position: HexVector.fromAxialCoordinates(2, 3)
      //})
    ]

    for (let i = 0; i < 10; i += 1) {
      for (let j = 0; j < 10; j += 1) {
        components.push(new debug.LabeledHexagon({
          text: `(${i}, ${j})`,
          position: HexVector.fromAxialCoordinates(i, j),
          spriteName: "hexagon-light-outline",
          scale: 0.1
        }));
      }
    }

    const compItem = new debug.CompositeItem({
      components,
      zIndex: 10,
    });

    this.components?.debugDiaplay.setItem("coordinates", compItem);
  }
}
