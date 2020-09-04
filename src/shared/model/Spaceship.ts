import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { HexVector } from "./HexVector";
import {
  PlayerRole
} from "./types";
import {
  GameEntity,
  GameEntityType,
  GAME_ENTITY_TYPES,
  PlayerControlledEntity,
  PositionEntity,
  RotationEntity,
  HitPointsEntity,
  VelocityEntity,
  TeamEntity
} from "./GameEntity";

import {
  GameEvent,
  SpaceshipDestroyed
} from "./GameEvent";

export class Spaceship implements
  PlayerControlledEntity,
  PositionEntity,
  RotationEntity,
  HitPointsEntity,
  VelocityEntity,
  TeamEntity
{
  static DEFAULT_HP = 10;
  readonly id: string;
  readonly entityType: GameEntityType = GAME_ENTITY_TYPES.Spaceship;
  playerRoleMap: Map<PlayerRole, string>;
  readonly spritesheetName: string = "ships";
  readonly spriteName: string;
  readonly spriteScale: number;
  teamId: string;
  shipType: string;
  position: HexVector;
  previousPosition: HexVector;
  rotation: number;
  currentHitPoints: number;
  maxHitPoints: number;
  velocity: HexVector;
  damagedBy: string[];

  constructor(params: Partial<Spaceship>) {
    // ya know, we could probably just say Object.assign(this, params)
    this.id = params.id;
    this.playerRoleMap = params.playerRoleMap,
    this.spriteName = params.spriteName;
    this.spriteScale = params.spriteScale;
    this.teamId = params.teamId ?? "noteam";
    this.shipType = params.shipType ?? "notype";
    this.position = HexVector.copy(params.position);
    this.previousPosition = this.position;
    this.velocity = params.velocity ? HexVector.copy(params.velocity) : HexVector.ZERO;
    this.rotation = params.rotation ?? 0;
    this.currentHitPoints = params.currentHitPoints ?? Spaceship.DEFAULT_HP;
    this.maxHitPoints = params.maxHitPoints ?? Spaceship.DEFAULT_HP;
  }

  setPosition(position: HexVector) {
    this.previousPosition = this.position;
    this.position = position;
  }

  getClientIds() {
    try {
      return Array.from(new Set(this?.playerRoleMap?.values?.()));
    } catch (err) {
      log.error(`getClientIds: ${err}`);
      return [];
    }
  }

  getClientIdRoles(clientId: string) {
    const roles: PlayerRole[] = [];
    this.playerRoleMap.forEach((cid, role) => {
      if (clientId == cid) roles.push(role);
    });

    return roles;
  }

  accelerate(v: HexVector): HexVector {
    this.velocity = this.velocity.plus(v);
    return this.velocity;
  }

  dealDamage(damage: number, sourceId: string) {
    if (damage < 0) {
      // TODO: actual effect validation!!
      log.warn(`negative damage source ${sourceId}`);
      return;
    }

    if (! this.damagedBy.includes(sourceId)) {
      this.damagedBy.push(sourceId);
    }

    this.currentHitPoints -= damage;
  }

  copyData() {
    return { ... this };
    //return {
    //  id: this.id,
    //  entityType: this.entityType,
    //  playerRoleMap: this.playerRoleMap,
    //  spriteName: this.spriteName,
    //  teamId: this.teamId,
    //  shipType: this.shipType,
    //  position: this.position,
    //  rotation: this.rotation,
    //  currentHitPoints: this.currentHitPoints,
    //  maxHitPoints: this.maxHitPoints,
    //  velocity: this.velocity
    //}
  }
}

export function isSpaceship(entity: GameEntity): entity is Spaceship {
  return entity.entityType == GAME_ENTITY_TYPES.Spaceship;
}
