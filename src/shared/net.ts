import {
  HexVector,
  GameEntity,
  GameAction,
  PlayerRole,
  GameEvent
} from "~shared/model";

export class Message {
}

export class Join extends Message {
  static event: string = "j";
  readonly clientId: string;

  constructor(clientId: string) {
    super();
    this.clientId = clientId;
  }
}

export class JoinResponse extends Message {
  static readonly event: string = "jr";
  readonly initialPosition: [number, number];

  constructor(initialPosition: [number, number]) {
    super();
    this.initialPosition = initialPosition;
  }
}

export class Quit extends Message {
  static readonly event: string = "q";
  //readonly clientId: string;
  readonly name: string;

  constructor(name: string) {
    super();
    //this.clientId = clientId;
    this.name = name;
  }
}

export class InitializeGameState extends Message {
  static readonly event: string = "s";
  readonly entityData: object[];
  readonly yourShipId: string;
  constructor(yourShipId: string, entities: GameEntity[]) {
    super();
    this.entityData = entities.map(e => e.copyData());
    this.yourShipId = yourShipId;
  }
}

export class UpdateGameState extends Message {
  static readonly event: string = "us";
  readonly entityData: object[];
  constructor(entities: GameEntity[]) {
    super();
    this.entityData = entities.map(e => e.copyData());
  }
}

export class AddPlayer extends Message {
  static readonly event: string = "ap";
}

export class RemovePlayer extends Message {
  static readonly event: string = "rp";
  readonly playerId: string;
}

export class ServerInfo extends Message {
  static readonly event: string = "f";
}

export class GamePing extends Message {
  static readonly event: string = "gp";
}

export class GamePong extends Message {
  static readonly event: string = "go";
}

export class SetActionQueue extends Message {
  static readonly event: string = "sa";
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
  static readonly event: string = "sma";

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
  static readonly event: string = "pa";
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
  static readonly event: string = "tw";
  readonly msRemaining: number;
  constructor(msRemaining: number) {
    super();
    this.msRemaining = msRemaining;
  }
}

export class TurnEnd extends Message {
  static readonly event: string = "te";
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
  static readonly event: string = "ts";
  readonly msRemaining: number;
  constructor(msRemaining: number) {
    super();
    this.msRemaining = msRemaining;
  }
}
