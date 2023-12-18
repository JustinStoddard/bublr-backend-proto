import { DataSource } from "typeorm";
import { LogCategory, LogFactory } from "./common/logging/logger";
import { get } from "./common/utils/env";
import { BubbleEntity, BubblesTable } from "./services/bubbles/bubble-table";
import { MessageEntity, MessagesTable } from "./services/messages/message-table";
import { UserEntity, UsersTable } from "./services/users/user-table";
import BubbleMigrations from "./migrations/bubbles/Bubbles";
import MessageMigrations from "./migrations/messages/Messages";
import UserMigrations from "./migrations/users/Users";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AppError, ErrorCodes, Issues } from "./common/errors/app-error";
import { BubbleService } from "./services/bubbles/bubble-service";
import { MessageService } from "./services/messages/message-service";
import { UserService } from "./services/users/user-service";
import { startWebServer } from "./web/webserver";

require('source-map-support').install();

const setup = () => {
  const log = LogFactory.getLogger[LogCategory.system];

  //Setup DataSources
  const url = new URL(get('POSTGRES_URL'));
  console.log("look here", url.toString());
  const bublrDataSource = new DataSource({
    url: url.toString(),
    type: "postgres",
    migrationsRun: true,
    entities: [
      UserEntity,
      BubbleEntity,
      MessageEntity,
    ],
    migrations: [
      ...UserMigrations,
      ...BubbleMigrations,
      ...MessageMigrations,
    ],
    migrationsTableName: "bublr_migrations",
    namingStrategy: new SnakeNamingStrategy(),
  });

  bublrDataSource.initialize().then(async () => {
    log.info({ message: `Connecting to database...` });
  }).catch(error => {
    throw new AppError({
      code: ErrorCodes.ERR_INTERNAL,
      issue: Issues.DATABASE_FAILED_TO_START,
      meta: {
        error,
      },
    });
  });

  //Setup Tables
  const bubblesTable = new BubblesTable(
    bublrDataSource,
  );
  const messagesTable = new MessagesTable(
    bublrDataSource,
  );
  const usersTable = new UsersTable(
    bublrDataSource,
  );

  //Setup Services
  const bubbleService = new BubbleService(
    bubblesTable,
  );
  const messageService = new MessageService(
    messagesTable,
  );
  const userService = new UserService(
    usersTable,
  );

  const port = parseInt(get('PORT'));
  startWebServer(port, {
    bubbleService,
    messageService,
    userService,
  });
};

setup();