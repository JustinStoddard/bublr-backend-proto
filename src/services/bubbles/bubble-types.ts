
export type Bubble = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  ownerId: string;
  name: string;
  longitude: string;
  latitude: string;
  radius: string;
};

export type BubbleInput = {
  ownerId: string;
  name: string;
  longitude: string;
  latitude: string;
  radius: string;
};

export type BubblePatch = {
  id: string;
  name?: string;
  longitude?: string;
  latitude?: string;
  radius?: string;
};

export type BubblesFilter = {
  ownerId: string;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type BubblePage = {
  total?: number;
  rows: Bubble[];
};