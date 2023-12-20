import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, IsNull, ManyToMany, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { Message, MessageInput, MessagePage, MessagePatch, MessagesFilter } from "./message-types";
import { UserEntity } from "../users/user-table";
import { BubbleEntity } from "../bubbles/bubble-table";


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

  @Column({ type: 'text' })
  bubbleId: string;

  @Column({ type: 'text' })
  ownerId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  dislikes: number;

  @Column({ type: 'int', default: 0 })
  reports: number;

  @ManyToMany(() => BubbleEntity, { cascade: true })
  bubbles: BubbleEntity[];
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

    if (filter?.bubbleId) {
      query = query.where('messages.bubble_id = :bubbleId');
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
        deletedAt: IsNull(),
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
      .where('id = :id and deleted_at is null', { id: patch.id })
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
      .where('id = :id and deleted_at is null', { id })
      .returning('*')
      .execute()
      .then(res => {
        const meta = this.db.getMetadata(MessageEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };
};