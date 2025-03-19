import { WebSocketServer } from "ws";
import { handleConnection } from "./connectionHandler";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const HOST = "0.0.0.0";

const chatServer = new WebSocketServer({ host: HOST, port: PORT });

chatServer.on("listening", () => {
  console.log(`WebSocket Server is running at ws://${HOST}:${PORT}`);
});

chatServer.on("connection", handleConnection);

chatServer.on("error", (err) => {
  console.error(`WebSocket Server error: ${err}`);
});

chatServer.on("close", () => {
  console.log("WebSocket server closed");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
