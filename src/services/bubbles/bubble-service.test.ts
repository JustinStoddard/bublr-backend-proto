import { DataSource } from "typeorm";
import { BubbleService } from "./bubble-service";
import { BubbleEntity, BubblesTable } from "./bubble-table";
import BubbleMigrations from "../../migrations/bubbles/Bubbles";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { get } from "../../common/utils/env";
import { BubbleInput, BubblePatch, BubblesFilter } from "./bubble-types";
import { anyId } from "../../common/utils/testutils";
import { expect } from "chai";
import { AuthContext } from "../../common/auth/auth-context";

describe("bubble-service", () => {
  let bubbleService: BubbleService;
  let bubbleDataSource: DataSource;
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
    bubbleDataSource = new DataSource({
      url: url.toString(),
      type: "postgres",
      migrationsRun: true,
      entities: [BubbleEntity],
      migrations: [...BubbleMigrations],
      migrationsTableName: "bublr_migrations",
      namingStrategy: new SnakeNamingStrategy(),
    });

    await bubbleDataSource.initialize()
      .then(() => console.log("Connected to database"))
      .catch(error => console.error(error));

    const bubbleTable = new BubblesTable(
      bubbleDataSource,
    );
    bubbleService = new BubbleService(
      bubbleTable,
    );
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
});