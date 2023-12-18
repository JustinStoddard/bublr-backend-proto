import Koa from 'koa';
import { LogCategory, LogFactory } from "../common/logging/logger";
import { BubbleService } from "../services/bubbles/bubble-service";
import { MessageService } from "../services/messages/message-service";
import { UserService } from "../services/users/user-service";
import { AuthMiddleware } from './middleware/auth-middleware';
import { ErrorMiddleware } from './middleware/error-middleware';
import { HealthController } from './controllers/health-controller';
import { BubblesController } from './controllers/bubbles-controller';
import { MessagesController } from './controllers/messages-controller';
import { UsersController } from './controllers/users-controller';

export const startWebServer = async (port: number, services: {
  bubbleService: BubbleService,
  messageService: MessageService,
  userService: UserService,
}) => {
  const log = LogFactory.getLogger(LogCategory.system);
  const app = new Koa();

  //Apply middleware
  app.use(AuthMiddleware());
  app.use(ErrorMiddleware());

  //Apply routes
  app.use(HealthController());
  app.use(BubblesController(services.bubbleService));
  app.use(MessagesController(services.messageService));
  app.use(UsersController(services.userService));

  return app.listen(port, () => {
    log.info({ message: `Listening on port: ${port}` });
  });
};