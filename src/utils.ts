const ID_DICTIONARY =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
const ID_LENGTH = 8;

export function generateRoomId(): string {
  return Array.from(
    { length: ID_LENGTH },
    () => ID_DICTIONARY[Math.floor(Math.random() * ID_DICTIONARY.length)]
  ).join("");
}

export function validateMessage(message: any): boolean {
  if (!message || typeof message !== "object" || !message.type) return false;
  const validTypes = ["create", "join", "chat"];
  if (!validTypes.includes(message.type)) return false;
  return message.payload && typeof message.payload === "object";
}
