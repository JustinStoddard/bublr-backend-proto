import Router, { IMiddleware } from "koa-router";
import bodyParser from "koa-bodyparser";
import { UserService } from "../../services/users/user-service";
import { UserInput, UserLoginInput, UserPatch } from "../../services/users/user-types";
import { AuthContext } from "../../common/auth/auth-context";

export const UsersController = (userService: UserService): IMiddleware => {

  const router = new Router();
  router.use(bodyParser());

  router.get('/api/users/:id', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const user = await userService.get(authCtx, ctx.params.id);
    ctx.body = user;
    ctx.status = 201;
  });

  router.get('/api/users', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const userPage = await userService.find(authCtx, ctx.request.query);
    ctx.body = userPage;
    ctx.status = 200;
  });

  router.patch('/api/users', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const patch = ctx.request.body as UserPatch;
    const patchedUser = await userService.patch(authCtx, patch);
    ctx.body = patchedUser;
    ctx.status = 200;
  });

  router.delete('/api/users', async ctx => {
    const authCtx = ctx.state.auth as AuthContext;
    const deletedUser = await userService.delete(authCtx, ctx.params.id);
    ctx.body = deletedUser;
    ctx.status = 200;
  });
  
  return router.routes();
};