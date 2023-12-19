import { DataSource } from "typeorm";
import { UserService } from "./user-service";
import { get } from "../../common/utils/env";
import { UserEntity, UsersTable } from "./user-table";
import UserMigrations from "../../migrations/users/Users";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AccountType, UserInput, UserLoginInput, UserPatch, UsersFilter } from "./user-types";
import { expect } from "chai";
import { anyAlphaNumeric } from "../../common/utils/testutils";

describe("user-service", () => {
  let userService: UserService;
  let userDataSource: DataSource;
  const handle = anyAlphaNumeric();
  const email = anyAlphaNumeric(); 

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
    );
  });

  it('Registers a user', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle,
      email,
      password: "stoic",
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);

    expect(user.user.displayName).to.equal(userInput.displayName);
    expect(user.user.handle).to.equal(userInput.handle);
    expect(user.user.email).to.equal(userInput.email);
    expect(user.user.accountType).to.equal(userInput.accountType);
    expect(user.token).to.not.be.null;
  });

  it('Logs in a user', async () => {
    const userLoginInput: UserLoginInput = {
      email,
      password: "stoic",
    };

    const user = await userService.login(userLoginInput);

    expect(user.user.email).to.equal(userLoginInput.email);
    expect(user.token).to.not.be.null;
  });

  it('Fetches a user', async () => {
    const userLoginInput: UserLoginInput = {
      email,
      password: "stoic",
    };

    const user = await userService.login(userLoginInput);
    expect(user.user.email).to.equal(userLoginInput.email);

    const fetchedUser = await userService.get(user.user.id);
    expect(fetchedUser.id).to.equal(user.user.id);
    expect(fetchedUser.displayName).to.equal(user.user.displayName);
    expect(fetchedUser.handle).to.equal(user.user.handle);
    expect(fetchedUser.email).to.equal(user.user.email);
    expect(fetchedUser.accountType).to.equal(user.user.accountType);
  });

  it('Fetches a page of users', async () => {
    await userService.register({
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyAlphaNumeric(),
      password: "stoic",
      accountType: AccountType.Premium,
    });
    await userService.register({
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyAlphaNumeric(),
      password: "stoic",
      accountType: AccountType.Premium,
    });
    await userService.register({
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyAlphaNumeric(),
      password: "stoic",
      accountType: AccountType.Premium,
    });

    const filter: UsersFilter = {
      accountType: AccountType.Premium,
      includeTotal: true,
    };

    const userPage = await userService.find(filter);
    expect(userPage.total).to.be.greaterThanOrEqual(3);
    expect(userPage.rows.length).to.equal(userPage.total);
    userPage.rows.map(user => {
      expect(user.accountType).to.equal(AccountType.Premium);
    });
  });

  it('Patches a user', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyAlphaNumeric(),
      password: "stoic",
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);
    expect(user.user.email).to.equal(userInput.email);

    const patch: UserPatch = {
      id: user.user.id,
      displayName: "patched display name",
    };
    const patchedUser = await userService.patch(patch);
    expect(patchedUser.id).to.equal(patch.id);
    expect(patchedUser.displayName).to.equal(patch.displayName);
  });

  it('Deletes a user', async () => {
    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyAlphaNumeric(),
      password: "stoic",
      accountType: AccountType.Premium,
    };

    const user = await userService.register(userInput);
    expect(user.user.email).to.equal(userInput.email);

    const deletedUser = await userService.delete(user.user.id);
    expect(deletedUser.id).to.equal(user.user.id);
    expect(deletedUser.deletedAt).to.not.be.null;
  });
});