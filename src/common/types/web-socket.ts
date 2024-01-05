import { WebSocket } from "ws";

export type WebSocketClient = {
  ownerId: string;
  socket: WebSocket;
};

export enum WebSocketEventType {
  UserUpdated = "user-updated",
  BubbleUpdated = "bubble-updated",
  MessageCreated = "message-created",
  MessageUpdated = "message-updated",
};

export type WebSocketEvent = {
  id: string;
  type: WebSocketEventType;
  corrId: string;
};