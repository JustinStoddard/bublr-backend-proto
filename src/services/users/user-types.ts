export enum AccountType {
  Standard = "standard",
  Premium = "premium",
  Business = "business",
}

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
};

export type UserInput = {
  displayName: string;
  handle: string;
  email: string;
  password: string;
  accountType: AccountType;
};

export type UserPatch = {
  id: string;
  displayName?: string;
  handle?: string;
  accountType?: AccountType;
};

export type UsersFilter = {
  accountType: AccountType;
  offset?: number;
  limit?: number;
  includeTotal?: boolean;
};

export type UserPage = {
  total?: number;
  rows: User[];
};