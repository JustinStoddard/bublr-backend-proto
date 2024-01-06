export enum AccountType {
  Standard = "standard",
  Premium = "premium",
  Business = "business",
}

export type BanStatus = {
  banExp: string;
  offenses: number;
  strikes: number;
};

export type User = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  displayName: string;
  handle: string;
  email: string;
  password: string;
  accountType: AccountType;
  banStatus: BanStatus;
};

export type UserInput = {
  displayName: string;
  handle: string;
  email: string;
  password: string;
  accountType: AccountType;
};

export type UserLoginInput = {
  email: string;
  password: string;
};

export type UserPatch = {
  id: string;
  displayName?: string;
  handle?: string;
  accountType?: AccountType;
  banStatus?: BanStatus;
};

export type UsersFilter = {
  displayName?: string;
  handle?: string;
  email?: string;
  accountType?: AccountType;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type UserPage = {
  total?: number;
  rows: User[];
};