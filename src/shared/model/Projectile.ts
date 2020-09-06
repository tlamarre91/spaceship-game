import { v4 as uuid } from "uuid";

import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { HexVector } from "./HexVector";
import {
  GameEntity,
  GameEntityType,
  GAME_ENTITY_TYPES,
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

export class Projectile implements
  PositionEntity,
  RotationEntity,
  HitPointsEntity,
  VelocityEntity,
  TeamEntity
{
  readonly id: string;
  readonly entityType: GameEntityType = GAME_ENTITY_TYPES.Projectile;
  readonly spriteName?: string;
  readonly spriteScale?: number;
  teamId: string;
  position: HexVector;
  previousPosition: HexVector;
  rotation: number;
  velocity: HexVector;
  currentHitPoints: number;
  maxHitPoints: number;
  damage: number;
  createdBy: string | null;

  constructor(params: Partial<Projectile>) {
    // ya know, we could probably just say Object.assign(this, params)
    this.id = params.id ?? uuid();
    this.spriteName = params.spriteName;
    this.spriteScale = params.spriteScale ?? 1;
    this.teamId = params.teamId ?? "noteam";
    this.position = params.position ? HexVector.copy(params.position) : HexVector.ZERO;
    this.previousPosition = params.previousPosition ?
      HexVector.copy(params.previousPosition)
      : this.position;
    this.velocity = params.velocity ? HexVector.copy(params.velocity) : HexVector.ZERO;
    this.rotation = params.rotation ?? 0;
    this.maxHitPoints = params.maxHitPoints ?? 1;
    this.currentHitPoints = params.currentHitPoints ?? this.maxHitPoints;
    this.damage = params.damage ?? 1;
    this.createdBy = params.createdBy ?? null;
  }

  setPosition(position: HexVector) {
    this.previousPosition = this.position;
    this.position = position;
  }

  accelerate(v: HexVector): HexVector {
    this.velocity = this.velocity.plus(v);
    return this.velocity;
  }

  copyData() {
    return { ... this };
    //return {
    //  id: this.id,
    //  entityType: this.entityType,
    //  spriteName: this.spriteName,
    //  teamId: this.teamId,
    //  position: this.position,
    //  rotation: this.rotation,
    //  currentHitPoints: this.currentHitPoints,
    //  maxHitPoints: this.maxHitPoints,
    //  velocity: this.velocity,
    //  damage: this.damage
    //}
  }
}

export function isProjectile(entity?: GameEntity): entity is Projectile {
  return entity ? entity.entityType == GAME_ENTITY_TYPES.Projectile : false;
}

