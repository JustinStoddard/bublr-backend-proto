import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { Message, MessageInput, MessagePage, MessagePatch, MessagesFilter } from "./message-types";


@Entity("messages")
export class MessageEntity extends BaseEntity {
  constructor() { super() };

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @Column('timestamptz')
  deletedAt: string | null;

  @Column()
  ownerId: string;

  @Column()
  parentBubbleId: string;

  @Column()
  content: string;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  @Column({ default: 0 })
  reports: number;
};

const mapEntity = (columns: ColumnMetadata[], obj: object): Message => {
  if (!obj) return null;

  const res = {};
  for (const column of columns) {
    res[column.propertyName] = obj[column.databaseName];
  }

  return res as Message;
};

export class MessagesTable {
  private messagesRepository: Repository<MessageEntity>;

  constructor(
    private db: DataSource,
  ) {
    this.messagesRepository = db.getRepository(MessageEntity);
  };

  filterQuery = (filter: MessagesFilter) => {
    let query = this.messagesRepository.createQueryBuilder("messages");

    if (filter?.ownerId) {
      query = query.where('messages.owner_id = :ownerId');
    }
    if (filter?.parentBubbleId) {
      query = query.where('messages.parent_bubble_id = :parentBubbleId');
    }

    return query.setParameters(filter);
  };

  total = async (filter: MessagesFilter): Promise<number> => {
    return await this.filterQuery(filter).getCount();
  };

  create = async (input: MessageInput): Promise<Message> => {
    return await this.messagesRepository.create(input).save();
  };

  get = async (id: string): Promise<Message> => {
    return await this.messagesRepository.find({
      where: {
        id,
      }
    }).then(res => res[0]);
  };

  find = async (filter: MessagesFilter): Promise<MessagePage> => {
    let page: MessagePage = {
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

  patch = async (patch: MessagePatch): Promise<Message> => {
    return await this.messagesRepository
      .createQueryBuilder('messages')
      .update(MessageEntity)
      .set(patch)
      .where('id = :id', { id: patch.id })
      .returning('*')
      .execute()
      .then(async res => {
        const meta = await this.db.getMetadata(MessageEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };

  delete = async (id: string) => {
    return await this.messagesRepository
      .createQueryBuilder('messages')
      .update(MessageEntity)
      .set({
        updatedAt: () => 'now()',
        deletedAt: () => 'now()',
      })
      .where('id = :id', { id })
      .returning('*')
      .execute()
      .then(res => {
        const meta = this.db.getMetadata(MessageEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };
};