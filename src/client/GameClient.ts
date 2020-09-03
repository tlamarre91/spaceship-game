import { v4 as uuid } from "uuid";
import io from "socket.io-client";
import * as Pixi from "pixi.js";
import { Viewport } from "pixi-viewport";

import { log } from "~shared/log";
import {
  lerp,
  idtrim
} from "~shared/util";

import {
  GameEntity,
  HexVector,
  GameState,
  PlayerRole
} from "~shared/model";
import * as net from "~shared/net";

import {
  GameBoard,
  VisualClock,
  VisualControls,
  VisualControlsOutput,
  VisualDebug
} from "./pixi-components";

import * as action from "~shared/model/GameAction";

export interface GameClientFlags {
  paused: boolean;
  debug: boolean;
}

export interface GameClientComponents {
  board: GameBoard;
  clock: VisualClock;
  controls: VisualControls;
  debug: VisualDebug;
  //entityContainer: RenderedEntityContainer;
}

export class GameClient {
  clientId: string;
  pixiApp: Pixi.Application;
  private socket: SocketIOClient.Socket = {} as SocketIOClient.Socket;
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
  private mySpaceshipId: string;

  private readonly PING_SAMPLES = 5;
  private readonly DEBUG_PER_SECOND = 10;
  private readonly CONTROLS_TIMEOUT = 500;

  private sendActionsTimeout: NodeJS.Timeout;

  constructor(
    pixiApp: Pixi.Application,
    loader: Pixi.Loader,
    resources: Record<string, Pixi.LoaderResource>
  ) {
    this.clientId = uuid();
    log.info(`initializing client ${idtrim(this.clientId)}`);
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
    this?.components?.controls?.onWindowResize();
    this?.components?.clock?.onWindowResize();
  }
  
  onConnect = () => {
    //log.info(`client ${idtrim(this.clientId)} sending Join`);
    const join = new net.Join(this.clientId);
    this.socket.emit(net.Join.event, join);
  };

  onPong = () => {
    //this.lastPongTime = Date.now();
    //const p = this.lastPongTime - this.lastPingTime;
    //if (this.averagePing != 0) {
    //  this.averagePing = (((this.PING_SAMPLES - 1) * this.averagePing) + p) / this.PING_SAMPLES
    //} else {
    //  this.averagePing = p;
    //}

    this.lastPongTime = Date.now();
    this.averagePing = this.lastPongTime - this.lastPingTime;
    this.components.debug.setEntry("ping", this.averagePing.toString());
  }

  onInitializeGameState = (msg: net.InitializeGameState) => {
    const {
      yourShipId,
      entityData
    } = msg;

    this.mySpaceshipId = yourShipId;
    this.components.board.initializeGameState(this.mySpaceshipId, entityData);
  }

  onTurnStart = (msg: net.TurnStart) => {
    this.components.clock.restart();
    this.sendActionQueues();
  }

  //onTurnWarn = (msg: net.TurnWarn) => {
  //  this.sendActionQueues();
  //}

  onControlsChange = (output: VisualControlsOutput) => {
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
    this?.components?.board?.gameState?.setEventQueue(turnEvents);
    this?.components?.board?.gameState?.passTurn();
  }

  sendActionQueues = () => {
    const controlsOutput = this.components.controls.getOutput();
    const accel = new action.AccelerateSelf(controlsOutput.acceleration);
    let roleActionTuples: [PlayerRole, action.GameAction[]][] = [["n", [accel]]];
    const shootVector = controlsOutput.shooting;
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
      this.components.debug.refresh();
    }
  }

  frame = 0;

  tick = () => {
    if (0 == this.frame) {
      const [x, y] = [Math.floor(Math.random() * 25), Math.floor(Math.random() * 25)];
      this?.components?.board.highlightHex(x, y);
      this?.components?.board.refresh();
    }

    this.components.clock.refresh();

    this.frame = (this.frame + 1) % 60;
    if (0 == this.frame) {
      this.components.debug.refresh();
    }
  }

  setupComponents() {
    const boardConfig = {
      origin: {
        x: this.viewport.width / 2,
        y: this.viewport.height / 2
      },
      boardScale: 30
    };

    const controlsConfig = {
      maxAcceleration: 3
    };

    const clockConfig = {
      maxTimeMs: 5000,
      width: 500,
      height: 10
    };

    this.components = {
      board: new GameBoard(this.resources, this.viewport, boardConfig),
      clock: new VisualClock(this.resources, clockConfig),
      controls: new VisualControls(this.resources, controlsConfig),
      debug: new VisualDebug(),
    };

    this.components.controls.addHandler(this.onControlsChange);
    this.components.debug.setEntry("clientId", idtrim(this.clientId));

    //this.viewport.removeChildren();
    this.viewport.addChild(this.components.board.container);
    this.pixiApp.stage.addChild(this.components.debug.renderedText);
    this.pixiApp.stage.addChild(this.components.controls.container);
    this.pixiApp.stage.addChild(this.components.clock.container);
  }

  setupSocket() {
    //this.socket = io("http://localhost:3000");
    this.socket = io();
    this.socket.on("connect", this.onConnect);
    //this.socket.on(net.TurnWarn.event, this.onTurnWarn);
    this.socket.on(net.GamePong.event, this.onPong);
    this.socket.on(net.TurnStart.event, this.onTurnStart);
    this.socket.on(net.TurnEnd.event, this.onTurnEnd);
    this.socket.on( net.InitializeGameState.event, this.onInitializeGameState);
  }

  start() {
    this.setupComponents();
    this.setupSocket();
    this.pixiApp.ticker.add(this.tick);
    //setInterval(this.sendPing, 1000);
  }
}

