import { parse as uuidParse } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get } from "../../common/utils/env"
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { LogCategory, LogFactory } from "../../common/logging/logger";
import { UsersTable } from "./user-table";
import { User, UserInput, UserLoginInput, UserPage, UserPatch, UsersFilter } from './user-types';

export class UserService {
  public log = LogFactory.getLogger(LogCategory.request);

  constructor(
    private users: UsersTable,
  ) {};

  throwNotFoundError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_NOT_FOUND,
      issue: Issues.USER_NOT_FOUND,
      meta: {
        ...args,
      }
    });
  };

  throwUserAlreadyExistsError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_FORBIDDEN,
      issue: Issues.USER_ALREADY_EXISTS,
      meta: {
        ...args,
      }
    });
  };

  throwPasswordIncorrectError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_FORBIDDEN,
      issue: Issues.PASSWORD_INCORRECT,
      meta: {
        ...args,
      }
    });
  };

  assertRequiredArgument = (argument: string, value) => {
    if (value !== undefined && value !== null) return;

    throw new AppError({
      code: ErrorCodes.ERR_BAD_INPUT,
      issue: Issues.REQUIRED_FIELD_MISSING,
      meta: {
        argument,
      },
    });
  };

  assertArgumentUuid = (argument: string, value) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new AppError({
        code: ErrorCodes.ERR_BAD_INPUT,
        issue: Issues.INVALID_UUID_FORMAT,
        meta: {
          argument,
        },
      });
    }

    return uuidParse(value);
  };

  assertUserInput = (input: UserInput) => {
    this.assertRequiredArgument('displayName', input.displayName);
    this.assertRequiredArgument('handle', input.handle);
    this.assertRequiredArgument('email', input.email);
    this.assertRequiredArgument('password', input.password);
    this.assertRequiredArgument('accountType', input.accountType);
  };

  assertUserLoginInput = (input: UserLoginInput) => {
    this.assertRequiredArgument('email', input.email);
    this.assertRequiredArgument('password', input.password);
  };

  assertUserPatch = (patch: UserPatch) => {
    this.assertArgumentUuid('id', patch.id);
  };

  private createJwt = (user: User): string => {
    const secret = get('BUBLR_JWT_SECRET');
    const token = jwt.sign({ ...user }, secret, { expiresIn: '4h' });
    return token;
  };

  register = async (input: UserInput): Promise<{ user: User, token: string }> => {
    this.assertUserInput(input);

    const filter: UsersFilter = {
      handle: input.handle,
      email: input.email,
    };
    const existingUser: User = await this.users.findOne(filter);

    if (existingUser) this.throwUserAlreadyExistsError({});

    const hashedPassword = await bcrypt.hash(input.password, 10);
    input.password = hashedPassword;
    const user: User = await this.users.create(input);

    this.log.info({ message: `registered user: ${user.id}` });

    const token = this.createJwt(user);

    return { user, token };
  };

  login = async (input: UserLoginInput): Promise<{ user: User, token: string }> => {
    this.assertUserLoginInput(input);

    const filter: UsersFilter = {
      email: input.email,
    };
    const user: User = await this.users.findOne(filter);

    if (!user) this.throwNotFoundError({ email: input.email });

    const passwordMatch = await bcrypt.compare(input.password, user.password);

    if (!passwordMatch) this.throwPasswordIncorrectError({});

    this.log.info({ message: `logged in user: ${user.id}` });
    
    const token = this.createJwt(user);

    return { user, token };
  };

  get = async (id: string): Promise<User> => {
    this.assertArgumentUuid('id', id);

    let user: User = await this.users.get(id);

    if (!user) this.throwNotFoundError({ id });

    this.log.info({ message: `fetched user: ${user.id}` });

    return user;
  };

  find = async (filter: UsersFilter): Promise<UserPage> => {
    return this.users.find(filter);
  };

  patch = async (patch: UserPatch): Promise<User> => {
    this.assertUserPatch(patch);

    let user: User = await this.users.get(patch.id);

    if (!user) this.throwNotFoundError({ id: patch.id });

    user = await this.users.patch(patch);

    this.log.info({ message: `patched user: ${user.id}` });

    return user;
  };

  delete = async (id: string): Promise<User> => {
    this.assertArgumentUuid('id', id);

    let user: User = await this.users.get(id);

    if (!user) this.throwNotFoundError({ id });

    user = await this.users.delete(id);

    this.log.info({ message: `deleted user: ${user.id}` });

    return user;
  };
};