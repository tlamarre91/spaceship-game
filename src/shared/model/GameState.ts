import { v4 as uuid } from "uuid";
import { log } from "~shared/log";
import { idtrim } from "~shared/util";

import {
  PLAYER_ROLES,
  PlayerRole,
} from "./types";

import { HexVector } from "./HexVector";
import { HexSegment } from "./HexSegment";

import {
  GameEntity,
  GameEntityFromData,
  PositionEntity,
  hasPosition,
  hasTeam,
  hasVelocity,
} from "./GameEntity";

import {
  Spaceship,
  isSpaceship
} from "./Spaceship";

import {
  Projectile,
  isProjectile
} from "./Projectile";

import * as action from "./GameAction";
import * as event from "./GameEvent";

import {
  ActionQueue,
  ActionQueueManager
} from "./ActionQueueManager";

export interface GameStateConfig {
  recordActionHistory: boolean;
  recordEventHistory: boolean;
}

export interface GameStateListeners {
  onEntitySpawned?: (entity: GameEntity) => void;
  onEntityRemoved?: (entity: GameEntity) => void;
  onEntityMoved?: (entity: GameEntity) => void;
  onTurnEnd?: (events?: event.GameEvent[]) => void;
}

export class GameState {
  /**
   * isCanonical: is this the canonical game instance, or a client instance?
   */
  readonly isCanonical: boolean;
  //entities: GameEntity[];
  //readonly gameId: string;
  //private entitiesById: Map<string, GameEntity>;
  //private clientIdSpaceships: Map<string, Spaceship>;
  //private spaceshipClientIds: Map<string, string[]>;
  //private actionQueueManager: ActionQueueManager;
  //private eventQueue: event.GameEvent[];
  //private turnCollisionPairs: [GameEntity, GameEntity][];
  //actionHistory: action.GameAction[][];
  //eventHistory: event.GameEvent[][];
  //listeners: GameStateListeners;
  entities: GameEntity[] = [];
  readonly gameId: string;
  private entitiesById: Map<string, GameEntity> = new Map();
  private clientIdSpaceships: Map<string, Spaceship> = new Map();
  private spaceshipClientIds: Map<string, string[]> = new Map();
  private actionQueueManager: ActionQueueManager = new ActionQueueManager();
  private eventQueue: event.GameEvent[] = [];
  private turnCollisionPairs: [GameEntity, GameEntity][] = [];
  actionHistory: action.GameAction[][] = [];
  eventHistory: event.GameEvent[][] = [];
  listeners: GameStateListeners = {};

  constructor(isCanonical: boolean = false) {
    this.isCanonical = isCanonical;
    //this.entities = [];
    //this.gameId = uuid();
    //this.entitiesById = new Map();
    //this.clientIdSpaceships = new Map();
    //this.spaceshipClientIds = new Map();
    //this.actionQueueManager = new ActionQueueManager();
    //this.eventQueue = [];
    //this.actionHistory = [[]];
    //this.eventHistory = [[]];
    //this.listeners = {};
  }

  /**
   * Make a new (non-canonical) GameState from raw entity data array
   */
  static fromEntityData(entityData: object[]): GameState {
    const gameState = new GameState(false);
    entityData
      .map(data => GameEntityFromData(data as GameEntity))
      .forEach((entity) => {
        if (isSpaceship(entity)) {
          gameState.addSpaceship(entity);
        } else {
          gameState.addEntity(entity);
        }
      });
    return gameState;
  }

  makeEntityId(): string {
    const id = uuid();
    if (this.entitiesById.get(id)) {
      log.info("uuid collision just happened; make a wish");
      return this.makeEntityId();
    } else {
      return id;
    }
  }

  addEntity(entity: GameEntity) {
    if (this.entitiesById.get(entity.id)) {
      throw new Error(`entity id ${idtrim(entity.id)} already in use`);
    }

    if (this.isCanonical) {
      try {
        const ev = new event.EntitySpawned(entity.copyData());
        this.eventQueue.push(ev);
      } catch (err) {
        log.error(err);
      }
    }

    this.entities.push(entity);
    this.entitiesById.set(entity.id, entity);
  }

  addSpaceship(spaceship: Spaceship) {
    if (this.entitiesById.get(spaceship.id)) {
      throw new Error(`entity id ${idtrim(spaceship.id)} already in use`);
    }

    this.addEntity(spaceship);
    this.actionQueueManager.addEntity(spaceship.id);
    const clientIds = spaceship.getClientIds();
    clientIds.forEach((id) => this.clientIdSpaceships.set(id, spaceship));
    this.spaceshipClientIds.set(spaceship.id, clientIds);
  }

  removeEntity(entity: GameEntity): GameEntity {
    return this.removeEntityId(entity?.id);
  }

  removeEntityId(entityId: string): GameEntity {
    if (! entityId) {
      log.warn(`tried removing entity with id ${entityId}`);
      return null;
    }

    const entity = this.entitiesById.get(entityId);
    if (! entity) {
      log.warn(`removeEntityId: entity with id ${idtrim(entity?.id)} does not exist`);
    } else {
      this.entitiesById.delete(entityId);
    }

    this.entities = this.entities.filter(e => e.id != entityId);

    if (entity instanceof Spaceship) {
      const clientIds = this.spaceshipClientIds.get(entityId);
      this.spaceshipClientIds.delete(entityId);
      this.actionQueueManager.removeSpaceship(entityId);
      clientIds.forEach(id => this.clientIdSpaceships.delete(id));
    }

    return entity;
  }

  getClientIdSpaceship(clientId: string): Spaceship {
    return this.clientIdSpaceships.get(clientId);
  }

  getEntitiesAtGrid(position: HexVector) {
    // TODO: store map of positions, and/or filtered list of positioned entities
    return this.entities.filter((e) => {
      if (hasPosition(e)) {
        return e.position.cubicRound().equals(position);
      }
    });
  }

  getActionQueue(spaceshipId: string): ActionQueue {
    return this.actionQueueManager.getActionQueue(spaceshipId);
  }

  setActionQueue(
    spaceshipId: string,
    playerRole: PlayerRole,
    queue: action.GameAction[]
  ) {
    this.actionQueueManager.setActionQueue(spaceshipId, playerRole, queue);
  }

  setEventQueue(events: event.GameEvent[]) {
    if (this.isCanonical) {
      log.warn("why are we calling setEventQueue on the canonical GameState?");
    }

    this.eventQueue = events;
  }

  flushEventQueue(): event.GameEvent[] {
    const eventQueue = this.eventQueue;
    this.eventQueue = [];
    return eventQueue;
  }

  private processActionQueue() {
    // TODO: use "turn stages"... or not
    const turnQueue: Map<string, ActionQueue> = this.actionQueueManager.flush();
    turnQueue.forEach((queue, spaceshipId) => {
      const spaceship: Spaceship = this.entitiesById.get(spaceshipId) as Spaceship;
      queue.forEach((actions, role) => {
        actions.forEach((action) => {
          try {
            this.processAction(spaceship, action, 0);
          } catch (err) {
            log.error(err);
          }
        });
      });
    });
  }

  private processAction(spaceship: Spaceship, gameAction: action.GameAction, stage: number) {
    // TODO: validate actions (eg: can this action be performed at
    // this time by this role with these parameters?)
    // TODO: factor out method for each action type
    // TODO: better just ditch instanceof for a type guard
    if (action.isAccelerateSelf(gameAction)) {
      spaceship.accelerate(gameAction.deltaVelocity);
    } else if (action.isSpawnProjectile(gameAction)) {
      const projectile = new Projectile({
        id: this.makeEntityId(),
        spriteName: "bullet",
        teamId: spaceship.teamId,
        position: spaceship.position,
        velocity: gameAction.initialVelocity,
        maxHitPoints: 5,
        damage: 1,
        createdBy: spaceship.id
      });

      this.addEntity(projectile);
      this.eventQueue.push(new event.EntitySpawned(projectile.copyData()));
    }
  }

  /**
   * look at the eventQueue and process each item. this should only be run by
   * non-canonical GameStates, as the canonical one generates the eventQueue
   * from processing GameActions and stepping the simulation forward.
   */
  private processEventQueue() {
    if (this.isCanonical) {
      log.warn("canonical GameState should not be processing events");
    }

    const events = this.flushEventQueue();
    const processed: event.GameEvent[] = [];
    events.forEach((ev) => {
      try {
        if (event.isEntityMoved(ev)) {
          this.processEntityMoved(ev);
        } else if (event.isEntitySpawned(ev)) {
          this.processEntitySpawned(ev);
        } else if (event.isSpaceshipJoined(ev)) {
          // TODO: wait... is this different from EntitySpawned?
          log.error(`processEvent not yet implemented for type ${ev.eventType}`);
        } else {
          // TODO: implement the rest!
          log.error(`processEvent not yet implemented for type ${ev.eventType}`);
        }

        processed.push(ev);
      } catch (err) {
        log.error(`processEventQueue: uncaught error on event: ${ev.eventType}`);
        log.error(err);
      }
    });

    this.eventHistory[this.eventHistory.length - 1].push(... processed);
  }

  private processEntityMoved(ev: event.EntityMoved) {
    const {
      entityId,
      toPos
    } = ev;

    try {
      const movedEntity = this.entitiesById.get(entityId);
      if (hasPosition(movedEntity)) {
        movedEntity.position = HexVector.copy(toPos);
        this.listeners?.onEntityMoved?.(movedEntity);
        log.info(`moved entity ${idtrim(entityId)} to ${movedEntity.position}`);
      } else {
        const err = `cannot process EntityMoved for entity without position: ${idtrim(entityId)}`;
        log.error(err);
      }
    } catch (err) {
      log.error(`processEntityMoved: ${err}`);
    }
  }

  private processEntitySpawned(gameEvent: event.EntitySpawned) {
    const {
      entityData
    } = gameEvent;

    const entity = GameEntityFromData(entityData as GameEntity);

    if (this.entitiesById.get(entity.id)) {
      // TODO: more graceful handling of this situation, which currently is known
      // to happen on game join: the initial state includes the player's new ship,
      // which is also included in the turn's events as an EntitySpawned
      log.warn(`processEntitySpawned: entity ${idtrim(entity.id)} already exists - skipping`);
      return;
    }

    if (isSpaceship(entity)) {
      this.addSpaceship(entity);
    } else if (isProjectile(entity)) {
      this.addEntity(entity);
    } else {
      throw new Error(`spawn type ${entity.entityType} not yet implemented`);
    }

    this.listeners?.onEntitySpawned?.(entity);
  }

  private simulate(deltaTime: number = 1) {
    this.entities.forEach((e) => {
      log.info(`simulating entity ${idtrim(e.id)}`);
      if (hasVelocity(e) && hasPosition(e)) {
        const deltaP: HexVector = deltaTime == 1 ? e.velocity : e.velocity.times(deltaTime);
        if (! deltaP.equals(HexVector.ZERO)) {
          e.position = e.position.plus(deltaP);
          //e.movedThisTurn = true;
          const ev = new event.EntityMoved(e.id, e.position);
          this.eventQueue.push(ev);
          this.listeners?.onEntityMoved?.(e);
        } else {
          log.info("thing didn't move");
          //e.movedThisTurn = false;
        }
      } else {
        log.info(`${idtrim(e.id)} ain't got no position`);
      }
    });
  }

  /**
   * Check each entity's path during the last simulation step and see if any
   * of them collided. If they did... do something!
   *
   * @remarks
   * Should only be called on canonical GameState
   */
  private detectCollisions() {
    this.entities.forEach((e, i) => {
      if (hasPosition(e) && hasVelocity(e)) {
        // TODO: WRONG! first detect if entity moved this turn.
        const path = new HexSegment(e.previousPosition, e.position);
      }
    });
  }

  passTurn() {
    if (this.isCanonical) {
      this.processActionQueue();
      this.simulate();
      const events = this.flushEventQueue();
      this.eventHistory.push(events);
      this.listeners.onTurnEnd?.(events);
    } else {
      this.eventHistory.push([]);
      this.processEventQueue();
      const events = this.eventHistory[this.eventHistory.length - 1];
      this.listeners.onTurnEnd?.(events);
    }
  }

  getHistory() {
    const actionHistory = this.actionHistory.slice();
    const eventHistory = this.eventHistory.slice();
    return { actionHistory, eventHistory };
  }
}
