import { parse as uuidParse } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get } from "../../common/utils/env"
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { LogCategory, LogFactory } from "../../common/logging/logger";
import { UsersTable } from "./user-table";
import { User, UserInput, UserLoginInput, UserPage, UserPatch, UsersFilter } from './user-types';
import { AuthContext } from '../../common/auth/auth-context';
import { WebSocketEventType } from '../../common/types/web-socket';

export class UserService {
  public log = LogFactory.getLogger(LogCategory.request);

  constructor(
    private users: UsersTable,
    private sendWebSocketEvent: (type: WebSocketEventType, corrId: string) => void,
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

  throwForbiddenError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_FORBIDDEN,
      issue: Issues.RESOURCE_NOT_AVAILABLE,
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

  isCurrentDateAheadOfBanDate = (banDateISOString: string): boolean => {
    const currentDate = new Date();
    const banDate = new Date(banDateISOString);
  
    const currentTimestamp = currentDate.getTime();
    const banDateTimestamp = banDate.getTime();
  
    return currentTimestamp > banDateTimestamp;
  };

  private createJwt = (user: User): string => {
    const secret = get('BUBLR_JWT_SECRET');
    const token = jwt.sign({ ...user }, secret, { expiresIn: '4h' });
    return token;
  };

  register = async (input: UserInput): Promise<{ user: User, token: string }> => {
    //Validate input
    this.assertUserInput(input);

    //Create filter
    const filter: UsersFilter = {
      handle: input.handle,
      email: input.email,
    };

    //Attempt to fetch user with unique email
    const existingUser: User = await this.users.findOne(filter);

    //Throw user already exist error if user exists
    if (existingUser) this.throwUserAlreadyExistsError({});

    //Encrypt password passed from input
    const hashedPassword = await bcrypt.hash(input.password, 10);

    //Override password field on input so encrypted password is whats stored in database
    input.password = hashedPassword;

    //Create user
    const user: User = await this.users.create(input);

    //Log that a user was registered
    this.log.info({ message: `registered user: ${user.id}` });

    //Create JWT
    const token = this.createJwt(user);

    return { user, token };
  };

  login = async (input: UserLoginInput): Promise<{ user: User, token: string }> => {
    //Validate input
    this.assertUserLoginInput(input);

    //Create filter
    const filter: UsersFilter = {
      email: input.email,
    };

    //Attempt to fetch user with email
    let user: User = await this.users.findOne(filter);

    console.log("USER STUFF", user);

    //Throw not found error if user wasn't found
    if (!user) this.throwNotFoundError({ email: input.email });

    //Throw forbidden error if user is banned
    if (user.banStatus.banExp && !this.isCurrentDateAheadOfBanDate(user.banStatus.banExp)) this.throwForbiddenError({ banStatus: user.banStatus });

    //Check if the password passed in input matched the password saved in database
    const passwordMatch = await bcrypt.compare(input.password, user.password);

    //Throw password incorrect error if passwords dont match
    if (!passwordMatch) this.throwPasswordIncorrectError({});

    //Log that a user logged in
    this.log.info({ message: `logged in user: ${user.id}` });
    
    //Create JWT
    const token = this.createJwt(user);

    return { user, token };
  };

  reportOffense = async (id: string): Promise<User> => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Fetch user
    let user: User = await this.users.get(id);

    //Throw not found error if user doesn't exist
    if (!user) this.throwNotFoundError({ id });

    const patch: UserPatch = {
      id: user.id,
      banStatus: {
        ...user.banStatus,
        offenses: user.banStatus.offenses + 1,
      },
    };

    user = await this.users.patch(patch);
    const maxUserOffenses = parseInt(get('MAX_USER_OFFENSES'));
    if (user.banStatus.offenses > maxUserOffenses) {
      //Ban user if user has more than 3 offenses.
      await this.strikeAndBan(patch.id);
    }

    return user;
  };

  strikeAndBan = async (id: string) => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Fetch user
    let user: User = await this.users.get(id);

    //Throw not found error if user doesn't exist
    if (!user) this.throwNotFoundError({ id });

    const currentDate = new Date();
    let futureDate = currentDate;
    if (user.banStatus.strikes === 0) {
      //Get a 3 day ban on your first strike.
      futureDate = new Date(currentDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    } else if (user.banStatus.strikes === 1) {
      //Get a 6 day ban on your second strike.
      futureDate = new Date(currentDate.getTime() + (6 * 24 * 60 * 60 * 1000));
    }

    const patch: UserPatch = {
      id: user.id,
      banStatus: {
        banExp: futureDate.toISOString(),
        offenses: 0,
        strikes: user.banStatus.strikes + 1,
      },
    };

    user = await this.users.patch(patch);
    const maxStrikesAllowed = parseInt(get('MAX_USER_STRIKES'));
    if (user.banStatus.strikes > maxStrikesAllowed) {
      //Delete user account if they have more than the allowed number of strikes. NO MERCY
      user = await this.users.delete(user.id);
    }
  };

  get = async (ctx: AuthContext, id: string): Promise<User> => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Throw forbidden error if user ids don't match
    if (id !== ctx.id) this.throwForbiddenError({ resource: "user" });

    //Fetch iser
    let user: User = await this.users.get(id);

    //Throw not found error if user didn't exist
    if (!user) this.throwNotFoundError({ id });

    //Log that a user fetched a user
    this.log.info({ message: `user: ${ctx.id} fetched user: ${user.id}` });

    return user;
  };

  find = async (ctx: AuthContext, filter: UsersFilter): Promise<UserPage> => {
    //Fetch users
    const userPage = await this.users.find(filter);

    //Log that a user fetched users
    this.log.info({ message: `user: ${ctx.id} fetched ${userPage.rows.length} users` });

    return userPage;
  };

  patch = async (ctx: AuthContext, patch: UserPatch): Promise<User> => {
    //Validate patch
    this.assertUserPatch(patch);

    //Throw forbidden error if user ids don't match
    if (patch.id !== ctx.id) this.throwForbiddenError({ resource: "user" });

    //Fetch user
    let user: User = await this.users.get(patch.id);

    //Throw not found error if user doesn't exist
    if (!user) this.throwNotFoundError({ id: patch.id });

    //Patch user
    user = await this.users.patch(patch);

    //Log that a user patched a user
    this.log.info({ message: `user: ${ctx.id} patched user: ${user.id}` });

    return user;
  };

  delete = async (ctx: AuthContext, id: string): Promise<User> => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Throw forbidden error if user ids don't match
    if (id !== ctx.id) this.throwForbiddenError({ resource: "user" });

    //Fetch user
    let user: User = await this.users.get(id);

    //Throw not found error if user doesn't exist
    if (!user) this.throwNotFoundError({ id });

    //Delete user
    user = await this.users.delete(id);

    //Log user deleted a user
    this.log.info({ message: `user: ${ctx.id} deleted user: ${user.id}` });

    return user;
  };
};