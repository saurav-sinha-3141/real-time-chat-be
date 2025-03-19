import { WebSocket } from "ws";
import { roomClients } from "./roomManager";

export function broadcastSystemMessage(roomId: string, message: string): void {
  const room = roomClients.get(roomId);
  if (!room) return;
  room.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "system", message }));
    } else {
      room.delete(client);
    }
  });
}
