import * as uuid from "uuid";
import { HexVector } from "./HexVector";
import { PlayerRole } from "./types";

export type ActionType =
  "a" |
  "s"

export const ACTION_TYPES: Record<string, ActionType> = {
  AccelerateSelf: "a",
  SpawnProjectile: "s"
}

export interface GameAction {
  readonly actionType: ActionType;
  readonly playerRole: PlayerRole;
  readonly actionId?: string;
  //readonly entityId: string;
}

export class AccelerateSelf implements GameAction {
  readonly actionType = ACTION_TYPES.AccelerateSelf;
  readonly playerRole = "n";
  readonly actionId: string;
  //readonly entityId: string;
  readonly deltaVelocity: HexVector;

  constructor(deltaVelocity: HexVector) {
    this.deltaVelocity = deltaVelocity;
  }
}

export function isAccelerateSelf(action: GameAction): action is AccelerateSelf {
  return action.actionType == ACTION_TYPES.AccelerateSelf;
}

export class SpawnProjectile implements GameAction {
  readonly actionType = ACTION_TYPES.SpawnProjectile;
  readonly playerRole = "w";
  readonly actionId: string;
  //readonly entityId: string;
  readonly initialVelocity: HexVector;

  constructor(initialVelocity: HexVector) {
    this.initialVelocity = initialVelocity;
  }
}

export function isSpawnProjectile(action: GameAction): action is SpawnProjectile {
  return action.actionType == ACTION_TYPES.SpawnProjectile;
}
