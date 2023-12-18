import Router, { IMiddleware } from "koa-router";
import { BubbleService } from "../../services/bubbles/bubble-service";
import bodyParser from "koa-bodyparser";
import { BubbleInput } from "../../services/bubbles/bubble-types";

export const BubblesController = (bubbleService: BubbleService): IMiddleware => {

  const router = new Router();
  router.use(bodyParser());

  router.post('/api/bubbles', async ctx => {
    const input = ctx.request.body as BubbleInput;
    const authContext = ctx.state.auth;
    const bubble = await bubbleService.create(input);
    console.log("look here", bubble);
    ctx.body = bubble;
    ctx.status = 201;
  });

  return router.routes();
};