import Router, { IMiddleware } from "koa-router";
import bodyParser from "koa-bodyparser";
import { MessageService } from "../../services/messages/message-service";
import { MessageInput, MessagePatch } from "../../services/messages/message-types";
import { AuthContext } from "../../common/auth/auth-context";

export const MessagesController = (
  messageService: MessageService,
  sendWebSocketMessage: () => void,
): IMiddleware => {

  const router = new Router();
  router.use(bodyParser());

  router.post('/api/messages', async ctx => {
    const input = ctx.request.body as MessageInput;
    const authCtx = ctx.state.auth as AuthContext;
    const message = await messageService.create(authCtx ,input);
    sendWebSocketMessage();
    ctx.body = message;
    ctx.status = 201;
  });

  router.get('/api/messages/:id', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const message = await messageService.get(authCtx, ctx.params.id);
    ctx.body = message;
    ctx.status = 201;
  });

  router.get('/api/messages', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const messagePage = await messageService.find(authCtx, ctx.request.query);
    ctx.body = messagePage;
    ctx.status = 201;
  });

  router.patch('/api/messages', async ctx => {
    const patch = ctx.request.body as MessagePatch;
    const authCtx = ctx.state.auth as AuthContext;
    const patchedMessage = await messageService.patch(authCtx, patch);
    ctx.body = patchedMessage;
    ctx.status = 200;
  });

  router.delete('/api/messages/:id', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const deletedMessage = await messageService.delete(authCtx, ctx.params.id);
    ctx.body = deletedMessage;
    ctx.status = 200;
  });

  return router.routes();
};