import * as uuid from "uuid";
import { HexVector } from "./HexVector";

export type EventType =
  "sj" |
  "sd" |
  "sm" |
  "em" |
  "es"

export const EVENT_TYPES: Record<string, EventType> = {
  SpaceshipJoined: "sj",
  SpaceshipDestroyed: "sd",
  SpaceshipDamaged: "sm",
  EntityMoved: "em",
  EntitySpawned: "es"
}

export interface GameEvent {
  readonly eventType: EventType;
}

// i think this is redundant with EntitySpawned. don't think the specificity is needed
export class SpaceshipJoined implements GameEvent {
  readonly eventType = EVENT_TYPES.SpaceshipJoined;
  readonly spaceshipId: string;
  constructor(spaceshipId: string) {
    this.spaceshipId = spaceshipId;
  }
}

export function isSpaceshipJoined(ev: GameEvent): ev is SpaceshipJoined {
  return ev.eventType == EVENT_TYPES.SpaceshipJoined;
}

export class SpaceshipDestroyed implements GameEvent {
  readonly eventType = EVENT_TYPES.SpaceshipDestroyed;
  readonly spaceshipId: string;
  constructor(spaceshipId: string) {
    this.spaceshipId = spaceshipId;
  }
}

export function isSpaceshipDestroyed(ev: GameEvent): ev is SpaceshipDestroyed {
  return ev.eventType == EVENT_TYPES.SpaceshipDestroyed;
}

export class SpaceshipDamaged implements GameEvent {
  readonly eventType = EVENT_TYPES.SpaceshipDamaged;
  readonly spaceshipId: string;
  readonly damage: number;

  constructor(spaceshipId: string, damage: number) {
    this.spaceshipId = spaceshipId;
    this.damage = damage;
  }
}

export function isSpaceshipDamaged(ev: GameEvent): ev is SpaceshipDamaged {
  return ev.eventType == EVENT_TYPES.SpaceshipDamaged;
}

export class EntityMoved implements GameEvent {
  readonly eventType = EVENT_TYPES.EntityMoved;
  readonly entityId: string;
  //readonly fromPos: HexVector;
  readonly toPos: HexVector;

  constructor(entityId: string, /* fromPos: HexVector, */ toPos: HexVector) {
    this.entityId = entityId;
    //this.fromPos = fromPos;
    this.toPos = toPos;
  }
}

export function isEntityMoved(ev: GameEvent): ev is EntityMoved {
  return ev.eventType == EVENT_TYPES.EntityMoved;
}

export class EntitySpawned implements GameEvent {
  readonly eventType = EVENT_TYPES.EntitySpawned;
  readonly entityData: object;

  constructor(entityData: object) {
    this.entityData = entityData;
  }
}

export function isEntitySpawned(ev: GameEvent): ev is EntitySpawned {
  return ev.eventType == EVENT_TYPES.EntitySpawned;
}
