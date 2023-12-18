import Router, { IMiddleware } from "koa-router";

export const HealthController = (): IMiddleware => {
  const router = new Router();

  router.get('/health', async resp => {
    resp.status = 200;
  });

  return router.routes();
};