import { DataSource } from "typeorm";
import { MessageService } from "./message-service";
import { MessageEntity, MessagesTable } from "./message-table";
import MessageMigrations from "../../migrations/messages/Messages";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { get } from "../../common/utils/env";
import { MessageInput, MessagePatch, MessagesFilter } from "./message-types";
import { anyId } from "../../common/utils/testutils";
import { expect } from "chai";
import { AuthContext } from "../../common/auth/auth-context";

describe("message-service", () => {
  let messageService: MessageService;
  let messageDataSource: DataSource;
  let authContext: AuthContext = {
    id: anyId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    displayName: "Jahstin",
    handle: "@stoic",
    email: "test@gmail.com",
    accountType: "premium",
    strikes: 0,
    iat: 4523452345234,
    exp: 1234123412343,
  };

  before(async () => {
    const url = new URL(get('POSTGRES_URL'));
    messageDataSource = new DataSource({
      url: url.toString(),
      type: "postgres",
      migrationsRun: true,
      entities: [MessageEntity],
      migrations: [...MessageMigrations],
      migrationsTableName: "bublr_migrations",
      namingStrategy: new SnakeNamingStrategy(),
    });

    await messageDataSource.initialize()
      .then(() => console.log("Connected to database"))
      .catch(error => console.error(error));

    const messageTable = new MessagesTable(
      messageDataSource,
    );

    messageService = new MessageService(
      messageTable,
    );
  });

  it('Creates a message', async () => {
    const parentBubbleId = anyId();
    const input: MessageInput = {
      ownerId: authContext.id,
      parentBubbleId,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.ownerId).to.equal(input.ownerId);
    expect(message.parentBubbleId).to.equal(parentBubbleId);
    expect(message.content).to.equal(input.content);
  });

  it('Fetches a message', async () => {
    const parentBubbleId = anyId();
    const input: MessageInput = {
      ownerId: authContext.id,
      parentBubbleId,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.ownerId).to.equal(input.ownerId);
    expect(message.parentBubbleId).to.equal(parentBubbleId);

    const fetchedMessage = await messageService.get(authContext, message.id);
    expect(fetchedMessage.id).to.equal(message.id);
    expect(fetchedMessage.ownerId).to.equal(message.ownerId);
    expect(fetchedMessage.parentBubbleId).to.equal(message.parentBubbleId);
    expect(fetchedMessage.content).to.equal(message.content);
  });

  it('Fetches a page of messages', async () => {
    const parentBubbleId = anyId();
    const input: MessageInput = {
      ownerId: authContext.id,
      parentBubbleId,
      content: "test",
    };

    await messageService.create(authContext, input);
    await messageService.create(authContext, input);
    await messageService.create(authContext, input);

    const filter: MessagesFilter = {
      ownerId: authContext.id,
      parentBubbleId,
      includeTotal: true,
    };
    const messagePage = await messageService.find(authContext, filter);

    expect(messagePage.total).to.be.greaterThanOrEqual(3);
    expect(messagePage.rows.length).to.equal(messagePage.total);
    messagePage.rows.map(message => {
      expect(message.ownerId).to.equal(filter.ownerId);
      expect(message.parentBubbleId).to.equal(parentBubbleId);
      return;
    });
  });

  it('Patches a message', async () => {
    const parentBubbleId = anyId();
    const input: MessageInput = {
      ownerId: authContext.id,
      parentBubbleId,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.ownerId).to.equal(input.ownerId);
    expect(message.parentBubbleId).to.equal(parentBubbleId);

    const patch: MessagePatch = {
      id: message.id,
      content: "patched",
    };
    const patchedMessage = await messageService.patch(authContext, patch);

    expect(patchedMessage.id).to.equal(message.id);
    expect(patchedMessage.content).to.equal(patch.content);
  });

  it('Deletes a message', async () => {
    const parentBubbleId = anyId();
    const input: MessageInput = {
      ownerId: authContext.id,
      parentBubbleId,
      content: "test",
    };

    const message = await messageService.create(authContext, input);
    expect(message.ownerId).to.equal(input.ownerId);
    expect(message.parentBubbleId).to.equal(parentBubbleId);

    const deletedMessage = await messageService.delete(authContext, message.id);
    expect(deletedMessage.id).to.equal(message.id);
    expect(deletedMessage.deletedAt).to.not.be.null;
  });
});