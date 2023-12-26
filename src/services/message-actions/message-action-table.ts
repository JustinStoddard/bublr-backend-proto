import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { MessageAction, MessageActionFilter, MessageActionInput, MessageActionPage, MessageActionType } from "./message-action-types";


@Entity("message_actions")
export class MessageActionEntity extends BaseEntity {
  constructor() { super() };

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @Column({ type: 'text' })
  userId: string;

  @Column({ type: 'text' })
  messageId: string;

  @Column({ type: 'text' })
  actionType: MessageActionType;
};

export class MessageActionsTable {
  private messageActionsRepository: Repository<MessageActionEntity>;

  constructor(
    private db: DataSource,
  ) {
    this.messageActionsRepository = db.getRepository(MessageActionEntity);
  };

  filterQuery = (filter: MessageActionFilter) => {
    let query = this.messageActionsRepository.createQueryBuilder("message_actions");

    if (filter?.userId) {
      query = query.where('message_actions.user_id = :userId');
    }
    if (filter?.messageId) {
      query = query.where('message_actions.message_id = :messageId');
    }
    if (filter?.actionType) {
      query = query.where('message_actions.action_type = :actionType');
    }

    return query.setParameters(filter);
  };

  total = async (filter: MessageActionFilter): Promise<number> => {
    return await this.filterQuery(filter).getCount();
  };

  create = async (input: MessageActionInput): Promise<MessageAction> => {
    return await this.messageActionsRepository.create(input).save();
  };

  get = async (id: string): Promise<MessageAction> => {
    return await this.messageActionsRepository.find({
      where: {
        id,
      }
    }).then(res => res[0]);
  };

  findOne = async (filter: MessageActionFilter): Promise<MessageAction> => {
    return (await this.find(filter)).rows[0];
  };

  find = async (filter: MessageActionFilter): Promise<MessageActionPage> => {
    let page: MessageActionPage = {
      rows: [],
    };

    const rows = await this.filterQuery(filter)
      .offset(filter.offset || 0)
      .limit(filter.limit || 0)
      .getMany();

    page.rows = rows;

    if (filter?.includeTotal) {
      const total = await this.total(filter);
      page.total = total;
    }

    return page;
  };

  delete = async (id: string) => {
    return await this.messageActionsRepository
      .createQueryBuilder('message_actions')
      .where('id = :id', { id })
      .delete()
      .execute();
  };
};