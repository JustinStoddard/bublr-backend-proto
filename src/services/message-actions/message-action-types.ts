
export enum MessageActionType {
  Like = "like",
  Dislike = "dislike",
  Report = "report",
};

export type MessageAction = {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  messageId: string;
  actionType: MessageActionType;
};

export type MessageActionInput = {
  userId: string;
  messageId: string;
  actionType: MessageActionType;
};

export type MessageActionFilter = {
  userId?: string;
  messageId?: string;
  actionType?: MessageActionType;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type MessageActionPage = {
  total?: number;
  rows: MessageAction[];
};