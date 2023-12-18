import Router, { IMiddleware } from "koa-router";
import bodyParser from "koa-bodyparser";
import { UserService } from "../../services/users/user-service";
import { UserInput } from "../../services/users/user-types";

export const UsersController = (userService: UserService): IMiddleware => {

  const router = new Router();
  router.use(bodyParser());

  router.post('/api/register', async ctx => {
    const input = ctx.request.body as UserInput;
    const authContext = ctx.state.auth;
    const user = userService.register(input);
    ctx.body = user;
    ctx.status = 201;
  });

  return router.routes();
};