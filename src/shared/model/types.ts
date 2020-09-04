import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { HexVector } from "./HexVector";
import {
  GameEvent,
  SpaceshipDestroyed
} from "./GameEvent";

export type PlayerRole = "n" | "e" | "s" | "w"; // nav, engineering, sensors, weapons
export const PLAYER_ROLES: PlayerRole[] = ["n", "e", "s", "w"];
