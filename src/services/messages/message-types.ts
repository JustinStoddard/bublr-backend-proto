export type Message = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  bubbleId: string;
  content: string;
  likes: number;
  dislikes: number;
  reports: number;
};

export type MessageInput = {
  bubbleId: string;
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
  bubbleId?: string;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type MessagePage = {
  total?: number;
  rows: Message[];
};