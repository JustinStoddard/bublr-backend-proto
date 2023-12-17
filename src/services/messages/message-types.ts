export type Message = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  ownerId: string;
  parentBubbleId: string;
  content: string;
  likes: number;
  dislikes: number;
  reports: number;
};

export type MessageInput = {
  ownerId: string;
  parentBubbleId: string;
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
  ownerId: string;
  parentBubbleId: string;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type MessagePage = {
  total?: number;
  rows: Message[];
};