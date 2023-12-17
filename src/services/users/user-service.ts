import { parse as uuidParse } from 'uuid';
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { LogCategory, LogFactory } from "../../common/logging/logger";
import { UsersTable } from "./user-table";
import { User, UserInput, UserPage, UserPatch, UsersFilter } from './user-types';


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

  assertUserPatch = (patch: UserPatch) => {
    this.assertArgumentUuid('id', patch.id);
  };

  register = async (input: UserInput): Promise<User> => {
    this.assertUserInput(input);

    const user: User = await this.users.create(input);

    this.log.info({ message: `registered user: ${user.id}` });

    return user;
  };

  login = async () => {

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

  delete = async (id: string) => {
    this.assertArgumentUuid('id', id);

    let user: User = await this.users.get(id);

    if (!user) this.throwNotFoundError({ id });

    user = await this.users.delete(id);

    this.log.info({ message: `deleted user: ${user.id}` });
  };
};