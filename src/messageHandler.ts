import { WebSocket } from "ws";
import { createRoom, joinRoom, broadcastMessage } from "./roomManager";
import { validateMessage } from "./utils";
import { broadcastSystemMessage } from "./broadcastManager";

export function handleMessage(socket: WebSocket, rawMessage: string) {
  let parsedMessage: any;

  try {
    parsedMessage = JSON.parse(rawMessage);
  } catch {
    socket.send(JSON.stringify({ error: "Invalid JSON format" }));
    return;
  }

  if (!validateMessage(parsedMessage)) {
    socket.send(JSON.stringify({ error: "Invalid message format" }));
    return;
  }

  switch (parsedMessage.type) {
    case "create":
      const roomId = createRoom(socket, parsedMessage.payload.username);
      socket.send(JSON.stringify({ type: "roomCreated", roomId }));
      break;
    case "join":
      if (
        joinRoom(
          parsedMessage.payload.roomId,
          socket,
          parsedMessage.payload.username
        )
      ) {
        socket.send(
          JSON.stringify({
            type: "joinedRoom",
            roomId: parsedMessage.payload.roomId,
          })
        );
      } else {
        socket.send(JSON.stringify({ error: "Invalid room ID" }));
      }
      break;
    case "chat":
      if (
        !broadcastMessage(
          parsedMessage.payload.roomId,
          parsedMessage.payload.message,
          socket
        )
      ) {
        socket.send(JSON.stringify({ error: "Could not deliver message" }));
      }
      break;
    default:
      socket.send(JSON.stringify({ error: "Unknown message type" }));
  }
}
