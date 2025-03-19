import { WebSocket } from "ws";
import { handleMessage } from "./messageHandler";
import { handleDisconnect } from "./roomManager";

export function handleConnection(socket: WebSocket) {
  console.log(`[${new Date().toISOString()}] New connection established`);
  socket.send(
    JSON.stringify({ type: "system", message: "Connected to WebSocket Server" })
  );

  socket.on("message", (message) => handleMessage(socket, message.toString()));
  socket.on("close", () => handleDisconnect(socket));
  socket.on("error", (err) => console.error(`Socket error: ${err}`));
}
