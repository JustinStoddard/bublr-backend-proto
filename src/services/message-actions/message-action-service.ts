import { parse as uuidParse } from 'uuid';
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { LogCategory, LogFactory } from "../../common/logging/logger";
import { MessageService } from "../messages/message-service";
import { MessageActionsTable } from "./message-action-table";
import { MessageAction, MessageActionFilter, MessageActionInput, MessageActionPage, MessageActionType } from './message-action-types';
import { AuthContext } from '../../common/auth/auth-context';
import { MessagePatch } from '../messages/message-types';

export class MessageActionService {
  private log = LogFactory.getLogger(LogCategory.request);

  constructor(
    private messageActions: MessageActionsTable,
    private messages: MessageService,
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

  assertMessageActionInput = (input: MessageActionInput) => {
    this.assertRequiredArgument('userId', input.userId);
    this.assertRequiredArgument('messageId', input.messageId);
    this.assertRequiredArgument('actionType', input.actionType);
  };

  handleAction = async (ctx: AuthContext, operation: "create" | "delete", messageId: string, actionType: MessageActionType) => {
    const message = await this.messages.get(ctx, messageId);

    if (actionType === MessageActionType.Like) {
      const patch: MessagePatch = {
        id: messageId,
        likes: operation === "create" ? message.likes + 1 : message.likes - 1,
      };
      await this.messages.patch(ctx, patch);
    } else if (actionType === MessageActionType.Dislike) {
      const patch: MessagePatch = {
        id: messageId,
        dislikes: operation === "create" ? message.dislikes + 1: message.dislikes - 1,
      };
      await this.messages.patch(ctx, patch);
    } else if (actionType === MessageActionType.Report) {
      const patch: MessagePatch = {
        id: messageId,
        reports: operation === "create" ? message.reports + 1: message.reports - 1,
      };
      await this.messages.patch(ctx, patch);
    }
  };

  create = async (ctx: AuthContext, input: MessageActionInput): Promise<MessageAction> => {
    //Validate input
    this.assertMessageActionInput(input);

    //Make sure message exists
    await this.messages.get(ctx, input.messageId);

    //Create message action
    const messageAction: MessageAction = await this.messageActions.create(input);

    //Update the message
    await this.handleAction(ctx, "create", input.messageId, input.actionType);

    //Log that the user created a message action
    this.log.info({ message: `user: ${ctx.id} created a message action: ${input.actionType}:${messageAction.id}` });

    return messageAction;
  };

  get = async (ctx: AuthContext, id: string): Promise<MessageAction> => {
    //Validate id
    this.assertArgumentUuid('id', id);

    //Fetch message action
    const messageAction: MessageAction = await this.messageActions.get(id);

    if (!messageAction) this.throwNotFoundError({ id, resource: "message-action" });

    //Log that the user fetched a message action
    this.log.info({ message: `user: ${ctx.id} fetched a message action: ${messageAction.id}` });

    return messageAction;
  };

  find = async (ctx: AuthContext, filter: MessageActionFilter): Promise<MessageActionPage> => {
    filter.userId = ctx.id; //Make sure user is always filtering by the message-actions they own.
    const messageActionPage = await this.messageActions.find(filter);

    //Log that user fetched messages
    this.log.info({ message: `user: ${ctx.id} fetched ${messageActionPage.rows.length} messages` });

    return messageActionPage;
  };

  delete = async (ctx: AuthContext, id: string) => {
    //validate id
    this.assertArgumentUuid('id', id);

    //Get message action/ make sure it exists
    const messageAction: MessageAction = await this.get(ctx, id);

    //Throw not found error if the message action does not exist
    if (!messageAction) this.throwNotFoundError({ id, resource: "message-action" });

    //Throw forbidden error if user tries to delete message action that doesn't belong to them.
    if (messageAction.userId !== ctx.id) this.throwForbiddenError({ resource: "message-action" });

    //Delete message action
    await this.messageActions.delete(id);

    //Patch message based on actionType
    await this.handleAction(ctx, "delete", messageAction.messageId, messageAction.actionType);

    //Log that the user fetched a message action
    this.log.info({ message: `user: ${ctx.id} deleted a message action: ${id}` });
  };
};