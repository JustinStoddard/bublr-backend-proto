import Router, { IMiddleware } from "koa-router";
import { LogCategory, LogFactory } from "../../common/logging/logger";

export const HealthController = (): IMiddleware => {
  const router = new Router();
  const log = LogFactory.getLogger(LogCategory.system);

  router.get('/api/health', async resp => {
    log.info({ message: "Health check" });
    resp.body = "Bublr is healthy :)"
    resp.status = 200;
  });

  return router.routes();
};