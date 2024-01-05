import { DataSource } from "typeorm";
import { MessageService } from "./message-service";
import { MessageEntity, MessagesTable } from "./message-table";
import MessageMigrations from "../../migrations/messages/Messages";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { get } from "../../common/utils/env";
import { MessageInput, MessagePatch, MessagesFilter } from "./message-types";
import { anyAlphaNumeric } from "../../common/utils/testutils";
import { expect } from "chai";
import { AuthContext } from "../../common/auth/auth-context";
import { BubbleEntity, BubblesTable } from "../bubbles/bubble-table";
import BubbleMigrations from "../../migrations/bubbles/Bubbles";
import { BubbleService } from "../bubbles/bubble-service";
import { UserEntity, UsersTable } from "../users/user-table";
import UserMigrations from "../../migrations/users/Users";
import { UserService } from "../users/user-service";
import { AccountType, UserInput } from "../users/user-types";
import { Bubble, BubbleInput } from "../bubbles/bubble-types";
import BubblesMessagesMigrations from "../../migrations/bubbles-messages/Bubbles-Messages";

describe("message-service", () => {
  let messageService: MessageService;
  let messageDataSource: DataSource;
  let authContext: AuthContext;
  let bubble: Bubble;

  before(async () => {
    const url = new URL(get('POSTGRES_URL'));
    messageDataSource = new DataSource({
      url: url.toString(),
      type: "postgres",
      migrationsRun: true,
      entities: [MessageEntity, BubbleEntity, UserEntity],
      migrations: [...MessageMigrations, ...BubbleMigrations, ...UserMigrations, ...BubblesMessagesMigrations],
      migrationsTableName: "bublr_migrations",
      namingStrategy: new SnakeNamingStrategy(),
    });

    await messageDataSource.initialize()
      .then(() => console.log("Connected to database"))
      .catch(error => console.error(error));

    const userTable = new UsersTable(
      messageDataSource,
    );
    const userService = new UserService(
      userTable,
      () => {},
    );

    const bubbleTable = new BubblesTable(
      messageDataSource,
    );
    const bubbleService = new BubbleService(
      bubbleTable,
      userService,
      () => {},
    );
    
    const messageTable = new MessagesTable(
      messageDataSource,
    );
    messageService = new MessageService(
      messageTable,
      userService,
      bubbleService,
      () => {},
    );

    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyAlphaNumeric(),
      password: anyAlphaNumeric(),
      accountType: AccountType.Premium,
    };
    const user = await userService.register(userInput);
    authContext = {
      ...user.user,
      iat: 234523452345,
      exp: 324523452345,
    };

    const bubbleInput: BubbleInput = {
      ownerId: authContext.id,
      name: anyAlphaNumeric(),
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };
    bubble = await bubbleService.create(authContext, bubbleInput);
  });

  it('Creates a message', async () => {
    const input: MessageInput = {
      bubbleId: bubble.id,
      ownerId: authContext.id,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.bubbleId).to.equal(input.bubbleId);
    expect(message.content).to.equal(input.content);
  });

  it('Fetches a message', async () => {
    const input: MessageInput = {
      bubbleId: bubble.id,
      ownerId: authContext.id,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.bubbleId).to.equal(input.bubbleId);

    const fetchedMessage = await messageService.get(authContext, message.id);
    expect(fetchedMessage.id).to.equal(message.id);
    expect(fetchedMessage.bubbleId).to.equal(message.bubbleId);
    expect(fetchedMessage.content).to.equal(message.content);
  });

  it('Fetches a page of messages', async () => {
    const input: MessageInput = {
      bubbleId: bubble.id,
      ownerId: authContext.id,
      content: "test",
    };

    await messageService.create(authContext, input);
    await messageService.create(authContext, input);
    await messageService.create(authContext, input);

    const filter: MessagesFilter = {
      bubbleId: bubble.id,
      includeTotal: true,
    };
    const messagePage = await messageService.find(authContext, filter);

    expect(messagePage.total).to.be.greaterThanOrEqual(3);
    expect(messagePage.rows.length).to.equal(messagePage.total);
    messagePage.rows.map(message => {
      expect(message.bubbleId).to.equal(bubble.id);
      return;
    });
  });

  it('Patches a message', async () => {
    const input: MessageInput = {
      bubbleId: bubble.id,
      ownerId: authContext.id,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.bubbleId).to.equal(input.bubbleId);

    const patch: MessagePatch = {
      id: message.id,
      content: "patched",
    };
    const patchedMessage = await messageService.patch(authContext, patch);

    expect(patchedMessage.id).to.equal(message.id);
    expect(patchedMessage.content).to.equal(patch.content);
  });

  it('Deletes a message', async () => {
    const input: MessageInput = {
      bubbleId: bubble.id,
      ownerId: authContext.id,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.bubbleId).to.equal(input.bubbleId);

    const deletedMessage = await messageService.delete(authContext, message.id);
    expect(deletedMessage.id).to.equal(message.id);
    expect(deletedMessage.deletedAt).to.not.be.null;
  });
});