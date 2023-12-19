import { parse as uuidParse } from 'uuid';
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { LogCategory, LogFactory } from "../../common/logging/logger";
import { MessagesTable } from "./message-table";
import { Message, MessageInput, MessagePage, MessagePatch, MessagesFilter } from './message-types';
import { AuthContext } from '../../common/auth/auth-context';

export class MessageService {
  public log = LogFactory.getLogger(LogCategory.request);

  constructor(
    private messages: MessagesTable,
  ) {};

  throwNotFoundError = (args: any) => {
    throw new AppError({
      code: ErrorCodes.ERR_NOT_FOUND,
      issue: Issues.MESSAGE_NOT_FOUND,
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

  assertBubbleInput = (input: MessageInput) => {
    this.assertRequiredArgument('ownerId', input.ownerId);
    this.assertRequiredArgument('parentBubbleId', input.parentBubbleId);
    this.assertRequiredArgument('content', input.content);
  };

  assertBubblePatch = (patch: MessagePatch) => {
    this.assertArgumentUuid('id', patch.id);
  };

  create = async (ctx: AuthContext, input: MessageInput): Promise<Message> => {
    this.assertBubbleInput(input);

    const message: Message = await this.messages.create(input);

    this.log.info({ message: `user: ${ctx.id} created a message: ${message.id}` });

    return message;
  };

  get = async (ctx: AuthContext, id: string): Promise<Message> => {
    this.assertArgumentUuid('id', id);

    const message: Message = await this.messages.get(id);

    if (!message) this.throwNotFoundError({ id, resource: "message" });

    this.log.info({ message: `user: ${ctx.id} fetched message: ${message.id}` });

    return message;
  };

  find = async (ctx: AuthContext, filter: MessagesFilter): Promise<MessagePage> => {
    const messagePage = await this.messages.find(filter);

    this.log.info({ message: `user: ${ctx.id} fetched ${messagePage.rows.length} messages` });

    return messagePage;
  };

  patch = async (ctx: AuthContext, patch: MessagePatch): Promise<Message> => {
    this.assertBubblePatch(patch);

    let message: Message = await this.messages.get(patch.id);

    if (!message) this.throwNotFoundError({ id: patch.id, resource: "message" });

    message = await this.messages.patch(patch);

    this.log.info({ message: `user: ${ctx.id} patched message: ${message.id}` });

    return message;
  };

  delete = async (ctx: AuthContext, id: string): Promise<Message> => {
    this.assertArgumentUuid('id', id);

    let message: Message = await this.messages.get(id);

    if (!message) this.throwNotFoundError({ id, resource: "message" });

    message = await this.messages.delete(id);

    this.log.info({ message: `user: ${ctx.id} deleted message: ${message.id}` });

    return message;
  };
};