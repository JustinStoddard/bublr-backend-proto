import { IMiddleware } from "koa-router";
import { v4 as uuidv4 } from 'uuid';
import { AppError, AppErrorArgs, ErrorCodes, Issues } from "../../common/errors/app-error";

export const ErrorMiddleware = (): IMiddleware => {
  const mapError = (err: Error): [ number, AppErrorArgs ] => {
    if (err instanceof AppError) {
      switch (err.args.code) {
        case ErrorCodes.ERR_BAD_INPUT: return [ 400, err.args ];
        case ErrorCodes.ERR_NOT_FOUND: return [ 404, err.args ];
        case ErrorCodes.ERR_UNAUTHORIZED: return [ 401, err.args ]
        case ErrorCodes.ERR_FORBIDDEN: return [ 403, err.args ]
        default:
          console.log('Unhandled AppError %j', err.args);
          return [ 500, {
            code: ErrorCodes.ERR_INTERNAL,
            issue: Issues.INTERNAL_SERVER_ERROR
          }];
      }
    }

    const errorId = uuidv4();
    console.log(`InternalError ${errorId}: ${err.message}`);
    console.error(err);
    return [
      500,
      {
        code: ErrorCodes.ERR_INTERNAL,
        issue: Issues.INTERNAL_SERVER_ERROR,
        meta: {
          errorId,
        },
      },
    ];
  };

  return async (ctx, next) => {
    try {
      await next();
    }
    catch (err) {
      console.log("Got an error invoking handler: " + err.message)
      const [ status, args ] = mapError(err);
      ctx.status = status;
      ctx.body = { errors: [args] };
    }
  }
};