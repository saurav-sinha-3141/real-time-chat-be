import { WebSocketServer, WebSocket } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const HOST = "127.0.0.1";
const ID_DICTIONARY =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
const ID_LENGTH = 8;

type Message =
  | { type: "create"; payload: { username: string } }
  | { type: "join"; payload: { roomId: string; username: string } }
  | { type: "chat"; payload: { roomId: string; message: string } };

let roomClients = new Map<string, Map<WebSocket, string>>();

function generateRoomId(length: number): string {
  return Array.from(
    { length },
    () => ID_DICTIONARY[Math.floor(Math.random() * ID_DICTIONARY.length)]
  ).join("");
}

function createRoom(clientSocket: WebSocket, username: string): string {
  const roomId = generateRoomId(ID_LENGTH);
  roomClients.set(roomId, new Map([[clientSocket, username]]));
  return roomId;
}

function joinRoom(
  roomId: string,
  clientSocket: WebSocket,
  username: string
): boolean {
  const validRoomId = new RegExp(`^[A-Za-z0-9]{${ID_LENGTH}}$`);
  if (!validRoomId.test(roomId) || !roomClients.has(roomId)) return false;

  const room = roomClients.get(roomId);
  if (!room) return false;

  room.set(clientSocket, username);
  broadcastSystemMessage(roomId, `${username} joined the room`);
  return true;
}

function broadcastMessage(
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

function broadcastSystemMessage(roomId: string, message: string): void {
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

function handleDisconnect(socket: WebSocket): void {
  roomClients.forEach((clients, roomId) => {
    if (clients.has(socket)) {
      const username = clients.get(socket);
      clients.delete(socket);

      if (clients.size === 0) {
        roomClients.delete(roomId);
        console.log(`Room ${roomId} deleted (empty).`);
      } else {
        broadcastSystemMessage(roomId, `${username} left the room`);
      }
    }
  });
}

function validateMessage(message: any): message is Message {
  if (!message || typeof message !== "object" || !message.type) return false;

  const validTypes = ["create", "join", "chat"];
  if (!validTypes.includes(message.type)) return false;

  if (
    message.type === "create" &&
    typeof message.payload?.username !== "string"
  )
    return false;
  if (
    message.type === "join" &&
    (typeof message.payload?.roomId !== "string" ||
      typeof message.payload?.username !== "string")
  )
    return false;
  if (
    message.type === "chat" &&
    (typeof message.payload?.roomId !== "string" ||
      typeof message.payload?.message !== "string")
  )
    return false;

  return true;
}

const chatServer = new WebSocketServer({ host: HOST, port: PORT });

chatServer.on("listening", () => {
  console.log(`WebSocket Server is running at ws://${HOST}:${PORT}`);
});

chatServer.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] New connection established`);

  socket.send(
    JSON.stringify({ type: "system", message: "Connected to WebSocket Server" })
  );

  socket.on("message", (message) => {
    let parsedMessage: any;

    try {
      parsedMessage = JSON.parse(message.toString());
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
        const { username: creatorUsername } = parsedMessage.payload;
        const roomId = createRoom(socket, creatorUsername);
        console.log(`Room ${roomId} created by ${creatorUsername}`);
        socket.send(JSON.stringify({ type: "roomCreated", roomId }));
        break;

      case "join":
        const { roomId: joinRoomId, username } = parsedMessage.payload;
        if (joinRoom(joinRoomId, socket, username)) {
          console.log(`${username} joined room: ${joinRoomId}`);
          socket.send(
            JSON.stringify({ type: "joinedRoom", roomId: joinRoomId })
          );
        } else {
          socket.send(JSON.stringify({ error: "Invalid room ID" }));
        }
        break;

      case "chat":
        const { roomId: chatRoomId, message: chatMessage } =
          parsedMessage.payload;
        if (!broadcastMessage(chatRoomId, chatMessage, socket)) {
          socket.send(JSON.stringify({ error: "Could not deliver message" }));
        }
        break;

      default:
        socket.send(JSON.stringify({ error: "Unknown message type" }));
        break;
    }
  });

  socket.on("close", () => handleDisconnect(socket));

  socket.on("error", (err) => {
    console.error(`Socket error: ${err}`);
  });
});

chatServer.on("error", (err) => {
  console.error(`WebSocket Server error: ${err}`);
});

chatServer.on("close", () => {
  console.log("WebSocket server closed");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});
