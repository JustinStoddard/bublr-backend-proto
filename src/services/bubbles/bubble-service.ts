import { parse as uuidParse } from 'uuid';
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { BubblesTable } from "./bubble-table";
import { Bubble, BubbleInput, BubblePage, BubblePatch, BubblesFilter } from "./bubble-types";
import { LogCategory, LogFactory } from '../../common/logging/logger';
import { AuthContext } from '../../common/auth/auth-context';

export class BubbleService {
  public log = LogFactory.getLogger(LogCategory.request);

  constructor(
    private bubbles: BubblesTable,
  ) {};

  throwNotFoundError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_NOT_FOUND,
      issue: Issues.BUBBLE_NOT_FOUND,
      meta: {
        ...args,
      }
    });
  };

  throwForbiddenError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_FORBIDDEN,
      issue: Issues.RESOURCE_NOT_AVAILABLE,
      meta: {
        ...args,
      }
    });
  };

  assertRequiredArgument = (argument: string, value) => {
    if (value !== undefined && value !== null) return;

    throw new AppError({
      code: ErrorCodes.ERR_BAD_INPUT,
      issue: Issues.REQUIRED_FIELD_MISSING,
      meta: {
        argument,
      },
    });
  };

  assertArgumentUuid = (argument: string, value) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new AppError({
        code: ErrorCodes.ERR_BAD_INPUT,
        issue: Issues.INVALID_UUID_FORMAT,
        meta: {
          argument,
        },
      });
    }

    return uuidParse(value);
  };

  assertBubbleInput = (input: BubbleInput) => {
    this.assertRequiredArgument('ownerId', input.ownerId);
    this.assertRequiredArgument('name', input.name);
    this.assertRequiredArgument('longitude', input.longitude);
    this.assertRequiredArgument('latitude', input.latitude);
    this.assertRequiredArgument('radius', input.radius);
  };

  assertBubblePatch = (patch: BubblePatch) => {
    this.assertArgumentUuid('id', patch.id);
  };

  create = async (ctx: AuthContext, input: BubbleInput): Promise<Bubble> => {
    this.assertBubbleInput(input);

    const bubble: Bubble = await this.bubbles.create(input);

    this.log.info({ message: `user: ${ctx.id} created a bubble: ${bubble.id}` });

    return bubble;
  };

  get = async (ctx: AuthContext, id: string): Promise<Bubble> => {
    this.assertArgumentUuid('id', id);

    const bubble: Bubble = await this.bubbles.get(id);

    if (!bubble) this.throwNotFoundError({ id });
    if (bubble.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble" });

    this.log.info({ message: `user: ${ctx.id} fetched bubble: ${bubble.id}` });

    return bubble;
  };

  find = async (ctx: AuthContext, filter: BubblesFilter): Promise<BubblePage> => {
    if (!filter?.ownerId) filter.ownerId = ctx.id;
    if (filter.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble-page" });
    const bubblePage = await this.bubbles.find(filter);

    this.log.info({ message: `user: ${ctx.id} fetched ${bubblePage.rows.length} bubbles` });

    return bubblePage;
  };

  patch = async (ctx: AuthContext, patch: BubblePatch): Promise<Bubble> => {
    this.assertBubblePatch(patch);

    let bubble: Bubble = await this.bubbles.get(patch.id);

    if (!bubble) this.throwNotFoundError({ id: patch.id });
    if (bubble.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble" });

    bubble = await this.bubbles.patch(patch);

    this.log.info({ message: `user: ${ctx.id} patched bubble: ${bubble.id}` });

    return bubble;
  };

  delete = async (ctx: AuthContext, id: string): Promise<Bubble> => {
    this.assertArgumentUuid('id', id);

    let bubble: Bubble = await this.bubbles.get(id);

    if (!bubble) this.throwNotFoundError({ id });
    if (bubble.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble" });

    bubble = await this.bubbles.delete(id);

    this.log.info({ message: `user: ${ctx.id} deleted bubble: ${bubble.id}` });

    return bubble;
  };
};