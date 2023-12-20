import { DataSource } from "typeorm";
import { BubbleService } from "./bubble-service";
import { BubbleEntity, BubblesTable } from "./bubble-table";
import BubbleMigrations from "../../migrations/bubbles/Bubbles";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { get } from "../../common/utils/env";
import { Bubble, BubbleInput, BubblePatch, BubblesFilter } from "./bubble-types";
import { anyAlphaNumeric } from "../../common/utils/testutils";
import { expect } from "chai";
import { AuthContext } from "../../common/auth/auth-context";
import { UserEntity, UsersTable } from "../users/user-table";
import UserMigrations from "../../migrations/users/Users";
import { UserService } from "../users/user-service";
import { AccountType, UserInput } from "../users/user-types";
import { MessageEntity, MessagesTable } from "../messages/message-table";
import MessageMigrations from "../../migrations/messages/Messages";
import BubblesMessagesMigrations from "../../migrations/bubbles_messages/Bubbles-Messages";
import { MessageService } from "../messages/message-service";
import { MessageInput } from "../messages/message-types";

describe("bubble-service", () => {
  let bubbleService: BubbleService;
  let messageService: MessageService;
  let bubbleDataSource: DataSource;
  let authContext: AuthContext;

  before(async () => {
    const url = new URL(get('POSTGRES_URL'));
    bubbleDataSource = new DataSource({
      url: url.toString(),
      type: "postgres",
      migrationsRun: true,
      entities: [BubbleEntity, UserEntity, MessageEntity],
      migrations: [...BubbleMigrations, ...UserMigrations, ...MessageMigrations, ...BubblesMessagesMigrations],
      migrationsTableName: "bublr_migrations",
      namingStrategy: new SnakeNamingStrategy(),
    });

    await bubbleDataSource.initialize()
      .then(() => console.log("Connected to database"))
      .catch(error => console.error(error));

    const userTable = new UsersTable(
      bubbleDataSource,
    );
    const userService = new UserService(
      userTable,
    );

    const bubbleTable = new BubblesTable(
      bubbleDataSource,
    );
    bubbleService = new BubbleService(
      bubbleTable,
      userService,
    );

    const messageTable = new MessagesTable(
      bubbleDataSource,
    );
    messageService = new MessageService(
      messageTable,
      bubbleService,
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
  });

  it('Creates a bubble', async () => {
    const input: BubbleInput = {
      ownerId: authContext.id,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(authContext, input);

    expect(bubble.ownerId).to.equal(input.ownerId);
    expect(bubble.name).to.equal(input.name);
    expect(bubble.longitude).to.equal(input.longitude);
    expect(bubble.latitude).to.equal(input.latitude);
    expect(bubble.radius).to.equal(input.radius);
  });

  it('Fetches a bubble', async () => {
    const input: BubbleInput = {
      ownerId: authContext.id,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(authContext, input);
    expect(bubble.ownerId).to.equal(input.ownerId);

    const fetchedBubble = await bubbleService.get(authContext, bubble.id);

    expect(fetchedBubble.id).to.equal(bubble.id);
    expect(fetchedBubble.ownerId).to.equal(bubble.ownerId);
    expect(fetchedBubble.name).to.equal(bubble.name);
    expect(fetchedBubble.longitude).to.equal(bubble.longitude);
    expect(fetchedBubble.latitude).to.equal(bubble.latitude);
    expect(fetchedBubble.radius).to.equal(bubble.radius);
  });

  it('Fetches a page of bubbles', async () => {
    const input: BubbleInput = {
      ownerId: authContext.id,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    //Create 3 bubbles
    await bubbleService.create(authContext, input);
    await bubbleService.create(authContext, input);
    await bubbleService.create(authContext, input);

    const filter: BubblesFilter = {
      ownerId: authContext.id,
      includeTotal: true,
    };
    const bubblePage = await bubbleService.find(authContext, filter);

    expect(bubblePage.total).to.be.greaterThanOrEqual(3);
    expect(bubblePage.rows.length).to.equal(bubblePage.total);
    bubblePage.rows.map(bubble => {
      expect(bubble.ownerId).to.equal(input.ownerId);
      return;
    });
  });

  it('Patches bubble', async () => {
    const input: BubbleInput = {
      ownerId: authContext.id,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(authContext, input);
    expect(bubble.ownerId).to.equal(input.ownerId);

    const updatedName = "updated-name";
    const updatedLongitude = -111.23452345;
    const updatedLatitude = 34.234523452
    const radius = 3.3;
    const patch: BubblePatch = {
      id: bubble.id,
      name: updatedName,
      longitude: updatedLongitude,
      latitude: updatedLatitude,
      radius,
    };
    const patchedBubble = await bubbleService.patch(authContext, patch);

    expect(patchedBubble.ownerId).to.equal(input.ownerId);
    expect(patchedBubble.name).to.equal(updatedName);
    expect(patchedBubble.longitude).to.equal(updatedLongitude);
    expect(patchedBubble.latitude).to.equal(updatedLatitude);
    expect(patchedBubble.radius).to.equal(radius);
  });

  it('Deletes bubble', async () => {
    const input: BubbleInput = {
      ownerId: authContext.id,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(authContext, input);
    expect(bubble.ownerId).to.equal(input.ownerId);

    const deletedBubble = await bubbleService.delete(authContext, bubble.id);
    expect(deletedBubble.id).to.equal(bubble.id);
    expect(deletedBubble.deletedAt).to.not.be.null;
  });

  it('Sends messages to parent and intersecting bubbles', async () => {
    //Create bubbles

    //Parent bubble
    const parentBubble = await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Parent bubble",
      longitude: -111.93937357479808,
      latitude: 40.607595375102306,
      radius: 5,
    });

    //Bubble near and intersecting with parent bubble
    const bubbleNearAndIntersecting = await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Bubble near and intersecting with parent bubble",
      longitude: -111.99470091302237,
      latitude: 40.606273182314425,
      radius: 4,
    });

    //Bubble near but not intersecting with parent bubble
    await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Bubble near but not intersecting with parent bubble",
      longitude: -112.08590781215449,
      latitude: 40.60135133931723,
      radius: 1,
    });

    //Bubble not near or intersecting with parent bubble
    await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Bubble not near or intersecting with parent bubble",
      longitude: -112.22812688371206,
      latitude: 40.599792638496865,
      radius: 5,
    });

    const input: MessageInput = {
      bubbleId: parentBubble.id,
      ownerId: authContext.id,
      content: anyAlphaNumeric(),
    };
    const message = await messageService.create(authContext, input);
    expect(message.bubbleId).to.equal(input.bubbleId);
    expect(message.ownerId).to.equal(input.ownerId);

    const fetchedParentBubble = await bubbleService.get(authContext, parentBubble.id);
    expect(fetchedParentBubble.id).to.equal(parentBubble.id);
    const foundCreatedMessageInParentBubble = fetchedParentBubble.messages.find(message => message.bubbleId === input.bubbleId);
    expect(foundCreatedMessageInParentBubble.content).to.equal(message.content);

    const fetchedIntersectingBubble = await bubbleService.get(authContext, bubbleNearAndIntersecting.id);
    expect(fetchedIntersectingBubble.id).to.equal(bubbleNearAndIntersecting.id);
    const foundCreatedMessageInIntersectingBubble = fetchedIntersectingBubble.messages.find(message => message.content === input.content);
    expect(foundCreatedMessageInIntersectingBubble.content).to.equal(message.content);
  });
});