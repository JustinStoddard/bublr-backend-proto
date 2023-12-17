export type AppErrorArgs = {
  code: string;
  issue?: string;
  meta?: { [x:string]: any };
}

export class AppError extends Error {
  constructor(public args: AppErrorArgs) {
    super(JSON.stringify(args, null, 2));
  }
}

export enum ErrorCodes {
  ERR_BAD_INPUT = "bad-input",
  ERR_UNAUTHORIZED = "unauthorized",
  ERR_NOT_FOUND = "not-found",
  ERR_FORBIDDEN = "forbidden",
  ERR_INTERNAL = "internal-server-error",
};

export enum Issues {
  REQUIRED_FIELD_MISSING = 'required-field-missing',
  INVALID_UUID_FORMAT = 'invalid-uuid-format',
  MALFORMED_TOKEN = 'malformed-token',
  BUBBLE_NOT_FOUND = 'bubble-not-found',
  MESSAGE_NOT_FOUND = 'message-not-found',
  USER_NOT_FOUND = 'user-not-found',
  USER_ALREADY_EXISTS = 'user-already-exists',
  PASSWORD_INCORRECT = 'password-incorrect',
};