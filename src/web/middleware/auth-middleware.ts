import Koa from 'koa';
import { IMiddleware } from "koa-router";
import jwt from 'jsonwebtoken';
import { get } from '../../common/utils/env';
import { AppError, ErrorCodes, Issues } from '../../common/errors/app-error';

const verifyToken = (ctx: Koa.ParameterizedContext) => {
  const token = ctx.header.authorization?.split(' ')[1];
  if (!token) {
    throw new AppError({
      code: ErrorCodes.ERR_UNAUTHORIZED,
      issue: Issues.TOKEN_NOT_PROVIDED,
    });
  }

  try {
    const secret = get('BUBLR_JWT_SECRET');
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    throw new AppError({
      code: ErrorCodes.ERR_UNAUTHORIZED,
      issue: Issues.INVALID_TOKEN,
    });
  }
};

export const AuthMiddleware = (): IMiddleware => {
  return async (ctx, next) => {
    ctx.state.auth = verifyToken(ctx);
    await next();
  };
};