import { DataSource } from "typeorm";
import { AuthContext } from "../../common/auth/auth-context";
import { Message, MessageInput } from "../messages/message-types";
import { MessageActionService } from "./message-action-service";
import { MessageEntity, MessagesTable } from "../messages/message-table";
import { BubbleEntity, BubblesTable } from "../bubbles/bubble-table";
import { UserEntity, UsersTable } from "../users/user-table";
import { MessageActionEntity, MessageActionsTable } from "./message-action-table";
import MessageMigrations from "../../migrations/messages/Messages";
import BubbleMigrations from "../../migrations/bubbles/Bubbles";
import UserMigrations from "../../migrations/users/Users";
import BubblesMessagesMigrations from "../../migrations/bubbles-messages/Bubbles-Messages";
import MessageActionMigrations from "../../migrations/message-actions/Message-Actions";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { get } from "../../common/utils/env";
import { UserService } from "../users/user-service";
import { BubbleService } from "../bubbles/bubble-service";
import { MessageService } from "../messages/message-service";
import { anyAlphaNumeric, anyEmail, anyPassword } from "../../common/utils/testutils";
import { AccountType, UserInput } from "../users/user-types";
import { BubbleInput } from "../bubbles/bubble-types";
import { MessageActionFilter, MessageActionInput, MessageActionType } from "./message-action-types";
import { expect } from "chai";

describe("message-action-service", () => {
  let messageActionService: MessageActionService;
  let messageService: MessageService;
  let authContext: AuthContext;
  let testMessage: Message;

  before(async () => {
    const url = new URL(get('POSTGRES_URL'));
    const messageActionDataSource = new DataSource({
      url: url.toString(),
      type: "postgres",
      migrationsRun: true,
      entities: [MessageActionEntity, MessageEntity, BubbleEntity, UserEntity],
      migrations: [...MessageActionMigrations, ...MessageMigrations, ...BubbleMigrations, ...UserMigrations, ...BubblesMessagesMigrations],
      migrationsTableName: "bublr_migrations",
      namingStrategy: new SnakeNamingStrategy(),
    });

    await messageActionDataSource.initialize()
      .then(() => console.log("Connected to database"))
      .catch(error => console.error(error));

    const userTable = new UsersTable(
      messageActionDataSource,
    );
    const userService = new UserService(
      userTable,
      () => {},
    );

    const bubbleTable = new BubblesTable(
      messageActionDataSource,
    );
    const bubbleService = new BubbleService(
      bubbleTable,
      userService,
      () => {},
    );

    const messageTable = new MessagesTable(
      messageActionDataSource,
    );
    messageService = new MessageService(
      messageTable,
      userService,
      bubbleService,
      () => {},
    );

    const messageActionTable = new MessageActionsTable(
      messageActionDataSource,
    );
    messageActionService = new MessageActionService(
      messageActionTable,
      messageService,
    );

    const userInput: UserInput = {
      displayName: "Jahstin",
      handle: anyAlphaNumeric(),
      email: anyEmail(),
      password: anyPassword(),
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
    const bubble = await bubbleService.create(authContext, bubbleInput);

    const messageInput: MessageInput = {
      bubbleId: bubble.id,
      ownerId: user.user.id,
      content: anyAlphaNumeric(25),
    };
    testMessage = await messageService.create(authContext, messageInput);
  });

  it('Creates a message action and increments counters based on action type', async () => {
    const input: MessageActionInput = {
      userId: authContext.id,
      messageId: testMessage.id,
      actionType: MessageActionType.Like,
    };
    const messageAction = await messageActionService.create(authContext, input);

    expect(messageAction.userId).to.equal(input.userId);
    expect(messageAction.messageId).to.equal(input.messageId);
    expect(messageAction.actionType).to.equal(input.actionType);

    const message = await messageService.get(authContext, input.messageId);
    expect(message.likes).to.equal(1);
  });

  it('Fetches a message action', async () => {
    const input: MessageActionInput = {
      userId: authContext.id,
      messageId: testMessage.id,
      actionType: MessageActionType.Like,
    };
    const messageAction = await messageActionService.create(authContext, input);
    expect(messageAction.userId).to.equal(input.userId);
    expect(messageAction.messageId).to.equal(input.messageId);
    expect(messageAction.actionType).to.equal(input.actionType);

    const fetchedMessageAction = await messageActionService.get(authContext, messageAction.id);
    expect(fetchedMessageAction.userId).to.equal(messageAction.userId);
    expect(fetchedMessageAction.messageId).to.equal(messageAction.messageId);
    expect(fetchedMessageAction.actionType).to.equal(messageAction.actionType);
  });

  it('Fetches a message action page', async () => {
    const input: MessageActionInput = {
      userId: authContext.id,
      messageId: testMessage.id,
      actionType: MessageActionType.Report,
    };
    const messageAction = await messageActionService.create(authContext, input);
    expect(messageAction.userId).to.equal(input.userId);
    expect(messageAction.messageId).to.equal(input.messageId);
    expect(messageAction.actionType).to.equal(input.actionType);

    const message = await messageService.get(authContext, messageAction.messageId);
    expect(message.reports).to.equal(1);

    const filter: MessageActionFilter = {
      messageId: testMessage.id,
      includeTotal: true,
    };

    const messageActionPage = await messageActionService.find(authContext, filter);
    expect(messageActionPage.total).to.be.greaterThanOrEqual(2);
    expect(messageActionPage.rows.length).to.equal(messageActionPage.total);
  });

  it('Deletes message action and decrements counters based on action type', async () => {
    const input: MessageActionInput = {
      userId: authContext.id,
      messageId: testMessage.id,
      actionType: MessageActionType.Dislike,
    };
    const messageAction = await messageActionService.create(authContext, input);
    expect(messageAction.userId).to.equal(input.userId);
    expect(messageAction.messageId).to.equal(input.messageId);
    expect(messageAction.actionType).to.equal(input.actionType);

    let message = await messageService.get(authContext, messageAction.messageId);
    expect(message.dislikes).to.equal(1);

    await messageActionService.delete(authContext, messageAction.id)

    message = await messageService.get(authContext, messageAction.messageId);
    expect(message.dislikes).to.equal(0);
  });
});