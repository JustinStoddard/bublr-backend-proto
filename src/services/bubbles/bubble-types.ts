
export type Bubble = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  ownerId: string;
  name: string;
  longitude: number;
  latitude: number;
  radius: number;
};

export type BubbleInput = {
  ownerId: string;
  name: string;
  longitude: number;
  latitude: number;
  radius: number;
};

export type BubblePatch = {
  id: string;
  name?: string;
  longitude?: number;
  latitude?: number;
  radius?: number;
};

export type BubblesFilter = {
  ownerId?: string;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type BubblePage = {
  total?: number;
  rows: Bubble[];
};