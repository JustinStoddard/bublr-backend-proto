import { DataSource } from "typeorm";
import { UserService } from "./user-service";
import { get } from "../../common/utils/env";
import { UserEntity, UsersTable } from "./user-table";
import UserMigrations from "../../migrations/users/Users";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AccountType, UserInput, UserLoginInput, UserPatch, UsersFilter } from "./user-types";
import { expect } from "chai";
import { anyAlphaNumeric, anyEmail, anyPassword } from "../../common/utils/testutils";
import { AuthContext } from "../../common/auth/auth-context";
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";

describe.only("user-service", () => {
  let userService: UserService;
  let userDataSource: DataSource;
  let authContext: AuthContext;
  let password: string = anyPassword();

  console.log("LOOK HERE", password);

  before(async () => {
    const url = new URL(get('POSTGRES_URL'));
    userDataSource = new DataSource({
      url: url.toString(),
      type: "postgres",
      migrationsRun: true,
      entities: [UserEntity],
      migrations: [...UserMigrations],
      migrationsTableName: "bublr_migrations",
      namingStrategy: new SnakeNamingStrategy(),
    });

    await userDataSource.initialize()
      .then(() => console.log("Connected to database"))
      .catch(error => console.error(error));

    const userTable = new UsersTable(
      userDataSource,
    );
    userService = new UserService(
      userTable,
      () => {},
    );
  });

  it('Registers a user', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyEmail(),
      password,
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);

    authContext = {
      ...user.user,
      iat: 234523452345,
      exp: 234523452345
    };

    expect(user.user.displayName).to.equal(userInput.displayName);
    expect(user.user.handle).to.equal(userInput.handle);
    expect(user.user.email).to.equal(userInput.email);
    expect(user.user.accountType).to.equal(userInput.accountType);
    expect(user.token).to.not.be.null;
  });

  it('Login a user', async () => {
    const userLoginInput: UserLoginInput = {
      email: authContext.email,
      password,
    };

    const user = await userService.login(userLoginInput);

    expect(user.user.email).to.equal(userLoginInput.email);
    expect(user.token).to.not.be.null;
  });

  it('Fetches a user', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyEmail(),
      password: anyPassword(),
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);
    expect(user.user.email).to.equal(userInput.email);

    authContext = {
      ...user.user,
      iat: 234523452345,
      exp: 234523452345
    };

    const fetchedUser = await userService.get(authContext, user.user.id);
    expect(fetchedUser.id).to.equal(user.user.id);
    expect(fetchedUser.displayName).to.equal(user.user.displayName);
    expect(fetchedUser.handle).to.equal(user.user.handle);
    expect(fetchedUser.email).to.equal(user.user.email);
    expect(fetchedUser.accountType).to.equal(user.user.accountType);
  });

  it('Fetches a page of users', async () => {
    const filter: UsersFilter = {
      accountType: AccountType.Premium,
      includeTotal: true,
    };

    const userPage = await userService.find(authContext, filter);
    expect(userPage.total).to.be.greaterThanOrEqual(1);
    expect(userPage.rows.length).to.equal(userPage.total);
    userPage.rows.map(user => {
      expect(user.accountType).to.equal(AccountType.Premium);
    });
  });

  it('Patches a user', async () => {
    const patch: UserPatch = {
      id: authContext.id,
      displayName: "patched display name",
    };
    const patchedUser = await userService.patch(authContext, patch);
    expect(patchedUser.id).to.equal(patch.id);
    expect(patchedUser.displayName).to.equal(patch.displayName);
  });

  it('Deletes a user', async () => {
    const deletedUser = await userService.delete(authContext, authContext.id);
    expect(deletedUser.id).to.equal(authContext.id);
    expect(deletedUser.deletedAt).to.not.be.null;
  });

  it('Should ban a user if they have 3 offenses', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyEmail(),
      password: anyPassword(),
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);
    expect(user.user.email).to.equal(userInput.email);

    authContext = {
      ...user.user,
      iat: 234523452345,
      exp: 234523452345
    };

    let guiltyUser = await userService.reportOffense(user.user.id);
    expect(guiltyUser.banStatus.offenses).to.equal(1);

    guiltyUser = await userService.reportOffense(user.user.id);
    expect(guiltyUser.banStatus.offenses).to.equal(2);

    guiltyUser = await userService.reportOffense(user.user.id);
    expect(guiltyUser.banStatus.offenses).to.equal(3);

    const fetchedUser = await userService.get(authContext, user.user.id);
    expect(fetchedUser.banStatus.strikes).to.equal(1);
    expect(fetchedUser.banStatus.banExp).to.not.be.null;

    const input: UserLoginInput = {
      email: userInput.email,
      password: userInput.password,
    };
    const error: AppError = await userService.login(input).catch(err => err);
    expect(error).to.be.instanceOf(AppError);
    expect(error.args.code).to.equal(ErrorCodes.ERR_FORBIDDEN);
    expect(error.args.issue).to.equal(Issues.RESOURCE_NOT_AVAILABLE);
  });

  it('Should delete user account if user has 3 strikes', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyEmail(),
      password: anyPassword(),
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);
    expect(user.user.email).to.equal(userInput.email);

    authContext = {
      ...user.user,
      iat: 234523452345,
      exp: 234523452345
    };

    await userService.reportOffense(user.user.id);
    await userService.reportOffense(user.user.id);
    await userService.reportOffense(user.user.id);

    let fetchedUser = await userService.get(authContext, user.user.id);
    expect(fetchedUser.banStatus.strikes).to.equal(1);

    await userService.reportOffense(user.user.id);
    await userService.reportOffense(user.user.id);
    await userService.reportOffense(user.user.id);

    fetchedUser = await userService.get(authContext, user.user.id);
    expect(fetchedUser.banStatus.strikes).to.equal(2);

    await userService.reportOffense(user.user.id);
    await userService.reportOffense(user.user.id);
    await userService.reportOffense(user.user.id);

    const input: UserLoginInput = {
      email: userInput.email,
      password: userInput.password,
    };
    const error: AppError = await userService.login(input).catch(err => err);
    expect(error).to.be.instanceOf(AppError);
    expect(error.args.code).to.equal(ErrorCodes.ERR_NOT_FOUND);
    expect(error.args.issue).to.equal(Issues.USER_NOT_FOUND);
  });
});