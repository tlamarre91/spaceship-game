import { v4 as uuid } from "uuid";
import { HexVector } from "./HexVector";
import { PlayerRole } from "./types";

//export type ActionType =
//  "a" |
//  "s"
//
//export const ACTION_TYPES: Record<string, ActionType> = {
//  AccelerateSelf: "a",
//  SpawnProjectile: "s"
//}

export enum ActionType {
  AccelerateSelf = "a",
  SpawnProjectile = "s"
}

/**
 * A pending action 
 */
export interface GameAction {
  readonly actionType: ActionType;
  readonly playerRole: PlayerRole;
  readonly actionId?: string;
  //readonly entityId: string;
}

export class AccelerateSelf implements GameAction {
  readonly actionType = ActionType.AccelerateSelf;
  readonly playerRole = "n";
  readonly actionId: string = uuid();

  constructor(readonly deltaVelocity: HexVector) { }
}

export function isAccelerateSelf(action: GameAction): action is AccelerateSelf {
  return action.actionType == ActionType.AccelerateSelf;
}

export class SpawnProjectile implements GameAction {
  readonly actionType = ActionType.SpawnProjectile;
  readonly playerRole = "w";
  readonly actionId: string = uuid();
  //readonly entityId: string;

  constructor(readonly initialVelocity: HexVector) { }
}

export function isSpawnProjectile(action: GameAction): action is SpawnProjectile {
  return action.actionType == ActionType.SpawnProjectile;
}
