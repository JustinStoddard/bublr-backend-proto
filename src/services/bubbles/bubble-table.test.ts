import { DataSource } from "typeorm";
import { AuthContext } from "../../common/auth/auth-context";
import { get } from "../../common/utils/env";
import { BubbleEntity, BubblesTable } from "./bubble-table";
import { UserEntity, UsersTable } from "../users/user-table";
import { MessageEntity } from "../messages/message-table";
import BubbleMigrations from "../../migrations/bubbles/Bubbles";
import UserMigrations from "../../migrations/users/Users";
import MessageMigrations from "../../migrations/messages/Messages";
import BubblesMessagesMigrations from "../../migrations/bubbles-messages/Bubbles-Messages";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { UserService } from "../users/user-service";
import { AccountType, UserInput } from "../users/user-types";
import { anyAlphaNumeric } from "../../common/utils/testutils";
import { BubbleService } from "./bubble-service";
import { Bubble } from "./bubble-types";
import { expect } from "chai";

describe('bubble-table', () => {
  let bubbleTable: BubblesTable;
  let bubbleService: BubbleService;
  let authContext: AuthContext;
  let parentBubble: Bubble;
  let bubbleNearAndIntersecting: Bubble;

  before(async () => {
    const url = new URL(get('POSTGRES_URL'));
    const bubbleDataSource = new DataSource({
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

    bubbleTable = new BubblesTable(
      bubbleDataSource,
    );
    bubbleService = new BubbleService(
      bubbleTable,
      userService,
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

  it('Should fetch bubble near parent bubbles within a 25 mile radius', async () => {
    //Create bubbles

    //Parent bubble
    parentBubble = await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Parent bubble",
      longitude: -111.93868075483469,
      latitude: 40.60926871316336,
      radius: 1,
    });

    //Bubble near and intersecting with parent bubble
    bubbleNearAndIntersecting = await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Bubble near and intersecting with parent bubble",
      longitude: -111.96752569104453,
      latitude: 40.60930329543499,
      radius: 1,
    });

    //Bubble near but not intersecting with parent bubble
    await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Bubble near but not intersecting with parent bubble",
      longitude: -112.02422149108165,
      latitude: 40.60942627104078,
      radius: 1,
    });

    //Bubble not near or intersecting with parent bubble
    await bubbleService.create(authContext, {
      ownerId: authContext.id,
      name: "Bubble not near or intersecting with parent bubble",
      longitude: -112.41635454318617,
      latitude: 40.60644245314866,
      radius: 1,
    });

    const bubblesNearParentBubble = await bubbleTable.bubblesNearParentBubble(parentBubble);

    bubblesNearParentBubble.map(bubble => {
      if (bubble.name === "Bubble not near or intersecting with parent bubble") expect(true).to.be.false;
      expect(true).to.be.true;
    });
  });

  it('Should only fetch bubbles that intersect with parent bubble', async () => {
    const bubblesIntersectingWithParentBubble = await bubbleTable.bubblesIntersectingWithParentBubble(parentBubble.id);

    bubblesIntersectingWithParentBubble.map(bubble => {
      if (bubble.name === "Bubble not near or intersecting with parent bubble" || bubble.name === "Bubble near but not intersecting with parent bubble") {
        expect(true).to.be.false;
      }
      expect(true).to.be.true;
    });
  });
});