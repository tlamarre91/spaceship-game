import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { PlayerRole } from "./types";
import { GameAction } from "./GameAction";

export type ActionQueue = Map<PlayerRole, GameAction[]>;

export class ActionQueueManager {
  private entityQueues: Map<string, ActionQueue>;

  static makeNewQueue(): ActionQueue {
    return new Map([
      ["n", []],
      ["e", []],
      ["s", []],
      ["w", []]
    ])
  }

  constructor() {
    this.entityQueues = new Map();
  }

  addEntity(entityId: string): void {
    if (this.entityQueues.has(entityId)) {
      throw new Error(`entity with ID ${entityId} is already in queue manager`);
    }

    this.entityQueues.set(entityId, ActionQueueManager.makeNewQueue());
  }

  removeSpaceship(entityId: string): void {
    this.entityQueues.delete(entityId);
  }

  getActionQueue(entityId: string): ActionQueue {
    return this.entityQueues.get(entityId);
  }

  setActionQueue(
    entityId: string,
    playerRole: PlayerRole,
    actions: GameAction[]
  ) {
    const queue = this.entityQueues.get(entityId);
    if (! queue) {
      throw new Error(`tried to set action queue for ${idtrim(entityId)} before adding entity to action queue manager`);
    }

    queue.set(playerRole, actions);
  }

  clearActionQueue(entityId: string, playerRole: PlayerRole) {
    const queue = this.entityQueues.get(entityId);
    if (! queue) {
      throw new Error(`tried to clear action queue for ${idtrim(entityId)} before adding entity to action queue manager`);
    }

    queue.set(playerRole, []);
  }

  flush(): Map<string, ActionQueue> {
    const ids: string[] = Array.from(this.entityQueues.keys());
    const ret = this.entityQueues;
    this.entityQueues = new Map(ids.map(id => {
      return [id, ActionQueueManager.makeNewQueue()]
    }));

    return ret;
  }
}
