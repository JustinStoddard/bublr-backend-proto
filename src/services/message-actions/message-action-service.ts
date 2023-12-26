import { parse as uuidParse } from 'uuid';
import { AppError, ErrorCodes, Issues } from "../../common/errors/app-error";
import { LogCategory, LogFactory } from "../../common/logging/logger";
import { MessageService } from "../messages/message-service";
import { MessageActionsTable } from "./message-action-table";
import { MessageAction, MessageActionInput } from './message-action-types';
import { AuthContext } from '../../common/auth/auth-context';


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

  create = async (ctx: AuthContext, input: MessageActionInput): Promise<MessageAction> => {
    //Validate input
    this.assertMessageActionInput(input);

    //Make sure message exists
    await this.messages.get(ctx, input.messageId);

    //Create message action
    const messageAction: MessageAction = await this.messageActions.create(input);

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
  };
};