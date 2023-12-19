import { parse as uuidParse } from 'uuid';
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { BubblesTable } from "./bubble-table";
import { Bubble, BubbleInput, BubblePage, BubblePatch, BubblesFilter } from "./bubble-types";
import { LogCategory, LogFactory } from '../../common/logging/logger';
import { AuthContext } from '../../common/auth/auth-context';
import { UserService } from '../users/user-service';

export class BubbleService {
  private log = LogFactory.getLogger(LogCategory.request);

  constructor(
    private bubbles: BubblesTable,
    private users: UserService,
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
    //Validate input
    this.assertBubbleInput(input);

    //Make sure the user exists
    await this.users.get(ctx, input.ownerId);

    //Create bubble
    const bubble: Bubble = await this.bubbles.create(input);

    //Log that the user created a bubble
    this.log.info({ message: `user: ${ctx.id} created a bubble: ${bubble.id}` });

    return bubble;
  };

  get = async (ctx: AuthContext, id: string): Promise<Bubble> => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Fetch bubble
    const bubble: Bubble = await this.bubbles.get(id);

    //Throw not found err if bubble wasn't found
    if (!bubble) this.throwNotFoundError({ id, resource: "bubble" });

    //Throw forbidden error if owner ids don't match
    if (bubble.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble" });

    //Log that user fetched a bubble
    this.log.info({ message: `user: ${ctx.id} fetched bubble: ${bubble.id}` });

    return bubble;
  };

  find = async (ctx: AuthContext, filter: BubblesFilter): Promise<BubblePage> => {
    //Always include the ownerId in the filter even if user doesn't pass it in.
    if (!filter?.ownerId) filter.ownerId = ctx.id;

    //Throw forbidden error if owner ids don't match
    if (filter.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble-page" });

    //Find bubble
    const bubblePage = await this.bubbles.find(filter);

    //Log that user fetched bubbles
    this.log.info({ message: `user: ${ctx.id} fetched ${bubblePage.rows.length} bubbles` });

    return bubblePage;
  };

  patch = async (ctx: AuthContext, patch: BubblePatch): Promise<Bubble> => {
    //Validate patch
    this.assertBubblePatch(patch);

    //Fetch bubble
    let bubble: Bubble = await this.bubbles.get(patch.id);

    //Throw not found error if bubble doesn't exist
    if (!bubble) this.throwNotFoundError({ id: patch.id, resource: "bubble" });

    //Throw forbidden error if owner ids don't match
    if (bubble.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble" });

    //Patch bubble
    bubble = await this.bubbles.patch(patch);

    //Log that user patched a bubble
    this.log.info({ message: `user: ${ctx.id} patched bubble: ${bubble.id}` });

    return bubble;
  };

  delete = async (ctx: AuthContext, id: string): Promise<Bubble> => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Fetch bubble
    let bubble: Bubble = await this.bubbles.get(id);

    //Throw not found error if bubble doesn't exist
    if (!bubble) this.throwNotFoundError({ id, resource: "bubble" });

    //Throw forbidden error if owner ids don't match
    if (bubble.ownerId !== ctx.id) this.throwForbiddenError({ resource: "bubble" });

    //Delete bubble
    bubble = await this.bubbles.delete(id);

    //Log that user deleted a bubble
    this.log.info({ message: `user: ${ctx.id} deleted bubble: ${bubble.id}` });

    return bubble;
  };
};