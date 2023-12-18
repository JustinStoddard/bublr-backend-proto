import { DataSource } from "typeorm";
import { BubbleService } from "./bubble-service";
import { BubbleEntity, BubblesTable } from "./bubble-table";
import BubbleMigrations from "../../migrations/bubbles/Bubbles";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { get } from "../../common/utils/env";
import { BubbleInput, BubblePatch, BubblesFilter } from "./bubble-types";
import { anyId } from "../../common/utils/testutils";
import { expect } from "chai";

describe("bubble-service", () => {
  let bubbleService: BubbleService;
  let bubbleDataSource: DataSource;

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
    const ownerId = anyId();
    const input: BubbleInput = {
      ownerId,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(input);

    expect(bubble.ownerId).to.equal(ownerId);
    expect(bubble.name).to.equal(input.name);
    expect(bubble.longitude).to.equal(input.longitude);
    expect(bubble.latitude).to.equal(input.latitude);
    expect(bubble.radius).to.equal(input.radius);
  });

  it('Fetches a bubble', async () => {
    const ownerId = anyId();
    const input: BubbleInput = {
      ownerId,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(input);
    expect(bubble.ownerId).to.equal(ownerId);

    const fetchedBubble = await bubbleService.get(bubble.id);

    expect(fetchedBubble.id).to.equal(bubble.id);
    expect(fetchedBubble.ownerId).to.equal(bubble.ownerId);
    expect(fetchedBubble.name).to.equal(bubble.name);
    expect(fetchedBubble.longitude).to.equal(bubble.longitude);
    expect(fetchedBubble.latitude).to.equal(bubble.latitude);
    expect(fetchedBubble.radius).to.equal(bubble.radius);
  });

  it('Fetches a page of bubbles', async () => {
    const ownerId = anyId();
    const input: BubbleInput = {
      ownerId,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    //Create 3 bubbles
    await bubbleService.create(input);
    await bubbleService.create(input);
    await bubbleService.create(input);

    const filter: BubblesFilter = {
      ownerId,
      includeTotal: true,
    };
    const bubblePage = await bubbleService.find(filter);

    expect(bubblePage.total).to.be.greaterThanOrEqual(3);
    expect(bubblePage.rows.length).to.equal(bubblePage.total);
  });

  it('Patches bubble', async () => {
    const ownerId = anyId();
    const input: BubbleInput = {
      ownerId,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(input);
    expect(bubble.ownerId).to.equal(ownerId);

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
    const patchedBubble = await bubbleService.patch(patch);

    expect(patchedBubble.ownerId).to.equal(ownerId);
    expect(patchedBubble.name).to.equal(updatedName);
    expect(patchedBubble.longitude).to.equal(updatedLongitude);
    expect(patchedBubble.latitude).to.equal(updatedLatitude);
    expect(patchedBubble.radius).to.equal(radius);
  });

  it('Deletes bubble', async () => {
    const ownerId = anyId();
    const input: BubbleInput = {
      ownerId,
      name: "test name",
      longitude: -100.43242342,
      latitude: 44.23452345,
      radius: 5.5,
    };

    const bubble = await bubbleService.create(input);
    expect(bubble.ownerId).to.equal(ownerId);

    const deletedBubble = await bubbleService.delete(bubble.id);
    expect(deletedBubble.id).to.equal(bubble.id);
    expect(deletedBubble.deletedAt).to.not.be.null;
  });
});