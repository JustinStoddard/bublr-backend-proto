import { Bubble } from "../bubbles/bubble-types";

export type Message = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  bubbleId: string;
  ownerId: string;
  content: string;
  likes: number;
  dislikes: number;
  reports: number;
  bubbles: Bubble[];
};

export type MessageInput = {
  bubbleId: string;
  ownerId: string;
  content: string;
};

export type MessagePatch = {
  id: string;
  content?: string;
  likes?: number;
  dislikes?: number;
  reports?: number;
};

export type MessagesFilter = {
  ownerId?: string;
  bubbleId?: string;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type MessagePage = {
  total?: number;
  rows: Message[];
};