import * as socketio from "socket.io";

import { log } from "~shared/log";

export class SocketClientMap {
  private clientSocketMap: Map<string, socketio.Socket>;
  private socketClientMap: Map<string, string>;

  constructor() {
    this.clientSocketMap = new Map();
    this.socketClientMap = new Map();
  }

  getSocketClient(socketId: string) {
    return this.socketClientMap.get(socketId);
  }

  getClientSocket(clientId: string) {
    return this.clientSocketMap.get(clientId);
  }

  set(clientId: string, socket: socketio.Socket) {
    // TODO: account for when record already exists
    this.clientSocketMap.set(clientId, socket);
    this.socketClientMap.set(socket.id, clientId);
  }

  delete(socketId?: string, clientId?: string) {
    const mismatch = socketId && clientId &&
      (
        this.clientSocketMap.get(clientId)?.id != socketId ||
        this.socketClientMap.get(socketId) != clientId
      );
    if (mismatch) {
      log.warn(`client/socket ID mismatch occurred. clientId: ${clientId}, socketId: ${socketId}`);
    }

    if (socketId) {
      const clientId = this.socketClientMap.get(socketId);
      this.socketClientMap.delete(socketId);
      if (clientId) {
        this.clientSocketMap.delete(clientId);
      }
    }

    if (clientId) {
      const socketId = this.clientSocketMap.get(clientId)?.id;
      this.clientSocketMap.delete(clientId);
      if(socketId) {
        this.socketClientMap.delete(socketId);
      }
    }
  }
}


