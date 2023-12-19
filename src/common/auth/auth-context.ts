export type AuthContext = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  displayName: string;
  handle: string;
  email: string;
  accountType: string;
  strikes: number;
  iat: number;
  exp: number;
};