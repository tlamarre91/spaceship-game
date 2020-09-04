import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { PlayerRole } from "./types";
import { GameAction } from "./GameAction";

export type ActionQueue = Map<PlayerRole, GameAction[]>;

/**
 * Storage structure for GameActions, storing an array of GameActions for each
 * player role of each Spaceship in the game
 */
export class ActionQueueManager {
  private queues: Map<string, ActionQueue>;

  static makeNewQueue(): ActionQueue {
    return new Map([
      ["n", []],
      ["e", []],
      ["s", []],
      ["w", []]
    ])
  }

  constructor() {
    this.queues = new Map();
  }

  addEntity(entityId: string): void {
    if (this.queues.has(entityId)) {
      throw new Error(`entity with ID ${entityId} is already in queue manager`);
    }

    this.queues.set(entityId, ActionQueueManager.makeNewQueue());
  }

  removeSpaceship(entityId: string): void {
    this.queues.delete(entityId);
  }

  getActionQueue(entityId: string): ActionQueue {
    return this.queues.get(entityId);
  }

  setActionQueue(
    entityId: string,
    playerRole: PlayerRole,
    actions: GameAction[]
  ) {
    const queue = this.queues.get(entityId);
    if (! queue) {
      throw new Error(`tried to set action queue for ${idtrim(entityId)} before adding entity to action queue manager`);
    }

    queue.set(playerRole, actions);
  }

  clearActionQueue(entityId: string, playerRole: PlayerRole) {
    const queue = this.queues.get(entityId);
    if (! queue) {
      throw new Error(`tried to clear action queue for ${idtrim(entityId)} before adding entity to action queue manager`);
    }

    queue.set(playerRole, []);
  }

  /**
   * reinitialize all action queues and return their current contents
   */
  flush(): Map<string, ActionQueue> {
    const ids: string[] = Array.from(this.queues.keys());
    const ret = this.queues;
    this.queues = new Map(ids.map(id => {
      return [id, ActionQueueManager.makeNewQueue()]
    }));

    return ret;
  }
}
