import { WebSocket } from "ws";
import { broadcastSystemMessage } from "./broadcastManager";
import { generateRoomId } from "./utils";

export const roomClients = new Map<string, Map<WebSocket, string>>();

export function createRoom(clientSocket: WebSocket, username: string): string {
  const roomId = generateRoomId();
  roomClients.set(roomId, new Map([[clientSocket, username]]));
  return roomId;
}

export function joinRoom(
  roomId: string,
  clientSocket: WebSocket,
  username: string
): boolean {
  if (!roomClients.has(roomId)) return false;
  const room = roomClients.get(roomId);
  if (!room) return false;
  room.set(clientSocket, username);
  broadcastSystemMessage(roomId, `${username} joined the room`);
  return true;
}

export function handleDisconnect(socket: WebSocket): void {
  roomClients.forEach((clients, roomId) => {
    if (clients.has(socket)) {
      const username = clients.get(socket);
      clients.delete(socket);
      if (clients.size === 0) {
        roomClients.delete(roomId);
      } else {
        broadcastSystemMessage(roomId, `${username} left the room`);
      }
    }
  });
}

export function broadcastMessage(
  roomId: string,
  message: string,
  senderSocket: WebSocket
): boolean {
  const room = roomClients.get(roomId);
  if (!room || !room.has(senderSocket) || message.trim().length === 0)
    return false;
  const senderUsername = room.get(senderSocket);
  room.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ type: "chat", sender: senderUsername, message })
      );
    } else {
      room.delete(client);
    }
  });
  return true;
}
