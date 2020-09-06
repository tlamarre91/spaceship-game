import * as socketio from "socket.io";
//import express from "express";
import * as http from "http";

import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { SocketClientMap } from "./SocketClientMap";

import {
  PlayerRole,
  PLAYER_ROLES,
  GameEntity,
  HexVector,
  Spaceship,
  BoxRegion
} from "~shared/model";

import * as event from "~shared/model/GameEvent";
import * as action from "~shared/model/GameAction";
import * as net from "~shared/net";

import { GameState } from "~shared/model/GameState";

export interface GameServerConfig {
  port: number;
  spamThreshold: number;
  /**
   * turnLength: length of turn in ms
   */
  turnLength: number;
  /**
   * warnTurnEnd: ms before turn ends to send TurnWarn
   */
  warnTurnEnd: number;
}

const CONFIG_DEFAULTS: GameServerConfig = {
  port: 3000,
  spamThreshold: 100,
  turnLength: 5000,
  warnTurnEnd: 3000
}

export class GameServer {
  static readonly PORT: number = 3000;
  httpServer: http.Server;
  port: number;
  gameState: GameState;
  private spamThreshold: number;
  private io: socketio.Server;
  private socketClientMap: SocketClientMap;
  private socketMessageCount: Map<string, number>;
  private socketLastMessageTime: Map<string, number>;
  private turnLength: number;
  private warnTurnEnd: number;
  turnNumber: number;
  private turnWarnTimeout: NodeJS.Timeout;
  private passTurnTimeout: NodeJS.Timeout;
  private turnHangingTimeout: NodeJS.Timeout;

  constructor(httpServer: http.Server, config?: Partial<GameServerConfig>) {
    this.httpServer = httpServer;
    this.socketClientMap = new SocketClientMap();
    this.socketMessageCount = new Map();
    this.socketLastMessageTime = new Map();
    this.config(config);
  }

  private config(config: Partial<GameServerConfig> = {}): void {
    this.port = config?.port ?? CONFIG_DEFAULTS.port;
    this.spamThreshold = config?.spamThreshold ?? CONFIG_DEFAULTS.spamThreshold;
    this.turnLength = config?.turnLength ?? CONFIG_DEFAULTS.turnLength;
    this.warnTurnEnd = config?.warnTurnEnd ?? CONFIG_DEFAULTS.warnTurnEnd;
  }

  private trackSocket(socketId: string) {
    this.socketLastMessageTime.set(socketId, Date.now());
    let count = this.socketMessageCount.get(socketId);
    if (! count) {
      count = 1;
    } else {
      count += 1;
    }

    this.socketMessageCount.set(socketId, count);
  }

  cleanupSocket(socket: socketio.Socket) {
    const clientId = this.socketClientMap.getSocketClient(socket.id);
    if (clientId) {
      this.onQuit(clientId);
    }
    this.socketClientMap.delete(socket.id);
  };

  emitToClient(clientId: string, event: string, msg: net.Message) {
    const socket = this.socketClientMap.getClientSocket(clientId);
    if (socket) socket.emit(event, msg);
  }

  emitToAll(event: string, msg: net.Message) {
    this.io.emit(event, msg);
  }

  private startTurn() {
    this.turnNumber += 1;
    log.info(`starting turn ${this.turnNumber}`);
    try {
      this.turnHangingTimeout = setTimeout(this.turnHangingCallback, this.turnLength + 1000);
      this.emitToAll(net.TurnStart.event, new net.TurnStart(this.turnLength));
      this.turnWarnTimeout = setTimeout(this.turnWarnCallback, this.turnLength - this.warnTurnEnd);
      this.passTurnTimeout = setTimeout(this.passTurnCallback, this.turnLength);
    } catch (err) {
      log.error(`startTurn: ${err}`);
    }
  }

  private turnWarnCallback = () => {
    log.info("turnWarnCallback");
    try {
      this.emitToAll(net.TurnWarn.event, new net.TurnWarn(this.turnLength - this.warnTurnEnd));
    } catch (err) {
      log.error(`TurnWarn: ${err as Error}`);
    }
  }

  private passTurnCallback = () => {
    this.gameState.passTurn();
  }

  private turnEndCallback = (events: event.GameEvent[]) => {
    try {
      log.info(`turnEndCallback events: ${JSON.stringify(events, null, 2)}`);
      this.emitToAll(net.TurnEnd.event, new net.TurnEnd(events));
      clearTimeout(this.turnHangingTimeout);
    } catch (err) {
      log.error(`turnEndCallback: ${err as Error}`);
    }

    this.startTurn();
  }

  private turnHangingCallback = () => {
    // TODO: do things to recover from bad stuff
    log.warn("detected hanging turn; forcing new turn");
    clearTimeout(this.turnWarnTimeout);
    clearTimeout(this.passTurnTimeout);
    this.startTurn();
  }

  listen(): void {
    // TODO: wait, is this httpServer.listen doing anything??
    // oh, yes it is.
    this.httpServer.listen(this.port, () => {
      log.info("game server listening");
    });

    this.io.on("connect", (socket: socketio.Socket) => {
      log.info(`client connected on port ${this.port}`);

      socket.use((_, next) => {
        this.trackSocket(socket.id)
        next(null);
      });

      socket.on(net.Join.event, (msg: net.Join) => {
        log.info("ONJOIN!!");
        let existingSocket = this.socketClientMap.getClientSocket(msg.clientId);
        if (existingSocket) {
          log.error(`re-joining not yet implemented (clientId: ${msg.clientId.slice(-8)})`);
        } else {
          this.socketClientMap.set(msg.clientId, socket);
          this.onJoin(msg);
        }
      });

      socket.on(net.Quit.event, (msg: net.Quit) => {
        try {
          let clientId = this.socketClientMap.getSocketClient(socket.id);
          if (clientId) {
            this.onQuit(clientId, msg);
          } else {
            // TODO: warn or something?
          }
          this.socketClientMap.delete(socket.id);
        } catch (err) {
          log.warn(`socket.on(Quit): ${err}`);
        }
      });

      socket.on(net.SetActionQueue.event, (msg: net.SetActionQueue) => {
        let clientId = this.socketClientMap.getSocketClient(socket.id);
        if (clientId) {
          this.onSetActionQueue(clientId, msg);
        } else {
          // TODO: warn or something?
        }
      });

      socket.on(net.SetMultipleActionQueues.event, (msg: net.SetMultipleActionQueues) => {
        let clientId = this.socketClientMap.getSocketClient(socket.id);
        if (clientId) {
          this.onSetMultipleActionQueues(clientId, msg);
        } else {
          // TODO: warn or something?
        }
      });

      socket.on(net.GamePing.event, () => {
        socket.emit(net.GamePong.event);
      });

      socket.on("disconnect", () => {
        log.info(`client disconnected`);
        this.cleanupSocket(socket);
      });
    });
  }

  public start() {
    this.turnNumber = 0;
    this.io = socketio.listen(this.httpServer, { origins: "*:*" });
    this.listen();
    this.gameState = new GameState(true);
    this.gameState.listeners.onTurnEnd = this.turnEndCallback;
    this.startTurn();
  }

  public testInit() {
  }

  removePlayer(clientId: string) {
    const spaceship = this.gameState.getClientIdSpaceship(clientId);
    if (spaceship) {
      this.gameState.removeEntity(spaceship);
    } else {
      // TODO: warn or something?
    }
  }

  onJoin = (msg: net.Join) => {
    const {
      clientId,
    } = msg;

    log.info(`join ${clientId.slice(-8)}`);
    const id = this.gameState.makeEntityId();
    const position = HexVector.random({
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 10
    } as BoxRegion).cubicRound();
    const spaceship: Spaceship = new Spaceship({
      id,
      position,
      spriteName: "ship2",
      spriteScale: 0.2,
      playerRoleMap: new Map(PLAYER_ROLES.map(r => [r, clientId]))
    });

    this.gameState.addSpaceship(spaceship);

    // TODO: send projection of state based on visibility to new ship
    const initializeMsg = new net.InitializeGameState(spaceship.id, this.gameState.entities);
    this.emitToClient(clientId, net.InitializeGameState.event, initializeMsg);
  };

  onQuit = (clientId: string, msg?: net.Quit) => {
    log.info(`quit! ${idtrim(clientId)}`);
    this.removePlayer(clientId);
  }

  onSetActionQueue = (clientId: string, msg: net.SetActionQueue) => {
    const {
      role,
      actions
    } = msg;
    try {
      const spaceship = this.gameState.getClientIdSpaceship(clientId);
      if (spaceship) {
        this.gameState.setActionQueue(spaceship.id, role, actions);
      } else {
        // TODO: warn or something?
      }
      // TODO: get teammate ids, send message to update their local action queues 
    } catch (err) {
      log.error(`onSetActionQueue: ${err as Error}`);
    }
  }

  onSetMultipleActionQueues = (clientId: string, msg: net.SetMultipleActionQueues) => {
    const {
      roleActionTuples
    } = msg;

    try {
      const spaceship = this.gameState.getClientIdSpaceship(clientId);
      log.info(`onSetMultipleActionQueues: ${JSON.stringify(msg, null, 2)}`);

      if (spaceship) {
        roleActionTuples.forEach(([role, actions]) => {
          try {
            this.gameState.setActionQueue(spaceship.id, role, actions);
          } catch (err) {
            log.error(`onSetMultipleActionQueues: ${err}`);
          }
        });
      } else {
        // TODO: warn or something?
      }
    } catch (err) {
      log.error(`onSetMultipleActionQueues: ${err}`);
    }
  }
}
