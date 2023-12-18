import Router, { IMiddleware } from "koa-router";
import bodyParser from "koa-bodyparser";
import { MessageService } from "../../services/messages/message-service";
import { MessageInput } from "../../services/messages/message-types";

export const MessagesController = (messageService: MessageService): IMiddleware => {

  const router = new Router();
  router.use(bodyParser());

  router.post('/api/bubbles', async ctx => {
    const input = ctx.request.body as MessageInput;
    const authContext = ctx.state.auth;
    const message = messageService.create(input);
    ctx.body = message;
    ctx.status = 201;
  });

  return router.routes();
};