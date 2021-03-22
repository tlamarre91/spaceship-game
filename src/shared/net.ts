/**
 * Definitions for messages passed between client and server.
 */
import {
  HexVector,
  GameEntity,
  GameAction,
  PlayerRole,
  GameEvent
} from "~shared/model";

export class Message {
}

// I could imagine making "event" just a very general category, and within a
// category, the Messages differentiate themselves. As opposed to having a
// million different event strings, and a million different dispatch functions.
// I could compartmentalize the dispatch system a little more, perhaps.
export enum EventString {
  AddPlayer = "ap",
  Admin = "admin",
  DumpState = "dump",
  GamePing = "gp",
  GamePong = "go",
  InitializeGameState = "s",
  Join = "j",
  JoinResponse = "jr",
  PushAction = "pa",
  Quit = "q",
  RemovePlayer = "rp",
  ServerInfo = "f",
  SetActionQueue = "sa",
  SetMultipleActionQueues = "sma",
  TurnEnd = "te",
  TurnStart = "ts",
  TurnWarn = "tw",
  UpdateGameState = "us",
}

export enum Command {
  DumpState = "d"
}

export class AdminCommand extends Message {
  static event = EventString.Admin;
  readonly clientId: string;
  readonly command: Command;
  constructor(clientId: string, command: Command) {
    super();
    this.clientId = clientId;
    this.command = command;
  }
}

export class DumpState extends Message {
  static event = EventString.DumpState;
}

export class Join extends Message {
  static event = EventString.Join;
  readonly clientId: string;

  constructor(clientId: string) {
    super();
    this.clientId = clientId;
  }
}

export class JoinResponse extends Message {
  static readonly event = EventString.JoinResponse;
  readonly initialPosition: [number, number];

  constructor(initialPosition: [number, number]) {
    super();
    this.initialPosition = initialPosition;
  }
}

export class Quit extends Message {
  static readonly event = EventString.Quit;
  //readonly clientId: string;
  readonly name: string;

  constructor(name: string) {
    super();
    //this.clientId = clientId;
    this.name = name;
  }
}

export class InitializeGameState extends Message {
  static readonly event = EventString.InitializeGameState;
  readonly entityData: object[];
  readonly yourShipId: string;
  constructor(yourShipId: string, entities: GameEntity[]) {
    super();
    this.entityData = entities.map(e => e.copyData());
    this.yourShipId = yourShipId;
  }
}

export class UpdateGameState extends Message {
  static readonly event = EventString.UpdateGameState;
  readonly entityData: object[];
  constructor(entities: GameEntity[]) {
    super();
    this.entityData = entities.map(e => e.copyData());
  }
}

export class AddPlayer extends Message {
  static readonly event = EventString.AddPlayer;
}

export class RemovePlayer extends Message {
  static readonly event = EventString.RemovePlayer;
  readonly playerId: string;
}

export class ServerInfo extends Message {
  static readonly event = EventString.ServerInfo;
}

export class GamePing extends Message {
  static readonly event = EventString.GamePing;
}

export class GamePong extends Message {
  static readonly event = EventString.GamePong;
}

export class SetActionQueue extends Message {
  static readonly event = EventString.SetActionQueue;
  //readonly clientId: string;
  readonly role: PlayerRole;
  readonly actions: GameAction[];
  constructor(role: PlayerRole, actions: GameAction[]) {
    super();
    //this.clientId = clientId;
    this.role = role;
    this.actions = actions;
  }
}

export class SetMultipleActionQueues extends Message {
  static readonly event = EventString.SetMultipleActionQueues;

  readonly roleActionTuples: [PlayerRole, GameAction[]][];
  constructor(roleActionTuples: [PlayerRole, GameAction[]][]) {
    super();
    this.roleActionTuples = roleActionTuples;
  }

  toString(): string {
    return `SetMultipleActionQueues {\n${JSON.stringify(this.roleActionTuples, null, 2)}\n}`;
  }
}

export class PushAction extends Message {
  static readonly event = EventString.PushAction;
  //readonly clientId: string;
  readonly role: PlayerRole;
  readonly action: GameAction;
  constructor(role: PlayerRole, action: GameAction) {
    super();
    //this.clientId = clientId;
    this.role = role;
    this.action = action;
  }
}

export class TurnWarn extends Message {
  static readonly event = EventString.TurnWarn;
  readonly msRemaining: number;
  constructor(msRemaining: number) {
    super();
    this.msRemaining = msRemaining;
  }
}

export class TurnEnd extends Message {
  static readonly event = EventString.TurnEnd;
  /**
   * turnEvents: all events that occurred this turn
   */
  readonly turnEvents: GameEvent[];

  /**
   * currentPosition: player's ship's current position. just to make sure
   * we didn't get out of sync, i guess?
   */
  readonly currentPosition: HexVector;

  constructor(turnEvents: GameEvent[]) {
    super();
    this.turnEvents = turnEvents;
  }
}

export class TurnStart extends Message {
  static readonly event = EventString.TurnStart;
  readonly msRemaining: number;
  constructor(msRemaining: number) {
    super();
    this.msRemaining = msRemaining;
  }
}
