import Router, { IMiddleware } from "koa-router";
import { BubbleService } from "../../services/bubbles/bubble-service";
import bodyParser from "koa-bodyparser";
import { BubbleInput, BubblePatch } from "../../services/bubbles/bubble-types";
import { AuthContext } from "../../common/auth/auth-context";

export const BubblesController = (bubbleService: BubbleService): IMiddleware => {

  const router = new Router();
  router.use(bodyParser());

  router.post('/api/bubbles', async ctx => {
    const input = ctx.request.body as BubbleInput;
    const authCtx = ctx.state.auth as AuthContext;
    const bubble = await bubbleService.create(authCtx, input);
    ctx.body = bubble;
    ctx.status = 201;
  });

  router.get("/api/bubbles/:id", async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const bubble = await bubbleService.get(authCtx, ctx.params.id);
    ctx.body = bubble;
    ctx.status = 200;
  });

  router.get("/api/bubbles", async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const bubblePage = await bubbleService.find(authCtx, ctx.request.query);
    ctx.body = bubblePage;
    ctx.status = 200;
  });

  router.patch("/api/bubbles", async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const patch = ctx.request.body as BubblePatch;
    const patchedBubble = await bubbleService.patch(authCtx, patch);
    ctx.body = patchedBubble;
    ctx.status = 200;
  });

  router.delete("/api/bubbles/:id", async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const bubble = await bubbleService.delete(authCtx, ctx.params.id);
    ctx.body = bubble;
    ctx.status = 200;
  });

  return router.routes();
};