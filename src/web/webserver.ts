import Koa from "koa";
import Http from "http";
import websockify from "koa-websocket";
import { v4 as uuidv4 } from 'uuid';
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
import { UserSessionsController } from './controllers/user-sessions-controller';
import { WebSocket } from "ws";

type WebSocketClient = {
  ownerId: string;
  socket: WebSocket;
};

export const startWebServer = async (port: number, services: {
  bubbleService: BubbleService,
  messageService: MessageService,
  userService: UserService,
}) => {
  const app = websockify(new Koa());
  const server = Http.createServer(app.callback());
  const log = LogFactory.getLogger(LogCategory.system);
  let clients: WebSocketClient[] = [];

  //Setup health controller
  app.use(HealthController());
  app.use(ErrorMiddleware());
  app.use(UserSessionsController(services.userService));

  //Apply middleware
  app.use(AuthMiddleware());

  // Initialize WebSocket server
  app.ws.use(async (ctx, next) => {
    log.info({ message: `WebSocket connection established with user:${ctx.query.ownerId}` });
    const ws: WebSocketClient = {
      ownerId: ctx.request.query.ownerId as string,
      socket: ctx.websocket,
    };
    clients = [...clients, ws];
    ws.socket.on('close', () => {
      clients = clients.filter(client => client.ownerId === ws.ownerId);
    });
    await next();
  });

  //Create a function that can be used to send messages through the websocket.
  const sendWebSocketMessage = () => {
    clients.map(client => {
      if (client.socket.readyState === client.socket.OPEN) {
        log.info({ message: `Sending message to ${client.ownerId}` });
        client.socket.send(uuidv4());
      }
    });
  };

  //Apply routes
  app.use(BubblesController(services.bubbleService));
  app.use(MessagesController(services.messageService, sendWebSocketMessage));
  app.use(UsersController(services.userService));

  return server.listen(port, () => {
    log.info({ message: `[HTTP Server]: Running on http://localhost:${port}` });
    log.info({ message: `[Web Socket]: Running on ws://localhost:${port}` });
  });
};