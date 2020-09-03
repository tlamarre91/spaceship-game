import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { HexVector } from "./HexVector";

import {
  PlayerRole
} from "./types";

import {
  GameEvent,
  SpaceshipDestroyed
} from "./GameEvent";

import {
  Spaceship,
  isSpaceship
} from "./Spaceship";

import {
  Projectile,
  isProjectile
} from "./Projectile";

export type GameEntityType =
  "s" |
  "p";

export const GAME_ENTITY_TYPES: Record<string, GameEntityType> = {
  Spaceship: "s",
  Projectile: "p"
}

export interface GameEntity {
  readonly id: string;
  readonly entityType: GameEntityType;
  spritesheetName?: string;
  spriteName: string;
  spriteScale: number;
  copyData(): object;
}

/**
 * GameEntityFromData: build a GameEntity from a data object.
 * (why not static function? Because GameEntity is an interface, not a class)
 */
export function GameEntityFromData(entityData: GameEntity): GameEntity {
  if (! entityData.entityType) {
    throw new Error(`object has no entityType (id: ${idtrim(entityData?.id)})`);
  }

  try {
    if (isSpaceship(entityData)) {
      return new Spaceship(entityData);
    } else if (isProjectile(entityData)) {
      return new Projectile(entityData);
    }
  } catch (err) {
    log.error(`GameEntityFromData: ${err}`);
    return null;
  }
}

export interface PlayerControlledEntity extends GameEntity {
  playerRoleMap: Map<PlayerRole, string>;
  getClientIds(): string[];
  getClientIdRoles(clientId: string): PlayerRole[];
}

export interface PositionEntity extends GameEntity {
  position: HexVector;
}

export function hasPosition(entity: GameEntity): entity is PositionEntity {
  return "position" in entity;
}

export interface RotationEntity extends GameEntity {
  rotation: number;
}

export function hasRotation(entity: GameEntity): entity is RotationEntity {
  return "rotation" in entity;
}

export interface HitPointsEntity extends GameEntity {
  currentHitPoints: number;
  maxHitPoints: number;
  damagedBy?: string[];
  //dead: boolean; // not sure yet how to handle killing ships
}

export function hasHitPoints(entity: GameEntity): entity is HitPointsEntity {
  return "currentHitPoints" in entity;
}

export interface VelocityEntity extends GameEntity {
  velocity: HexVector;
  accelerate(v: HexVector): HexVector;
}

export function hasVelocity(entity: GameEntity): entity is VelocityEntity {
  return "velocity" in entity;
}

export interface TeamEntity extends GameEntity {
  teamId: string;
}

export function hasTeam(entity: GameEntity): entity is TeamEntity {
  return "teamId" in entity;
}
