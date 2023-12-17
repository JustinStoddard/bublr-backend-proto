import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, MoreThan, MoreThanOrEqual, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { AccountType, User, UserInput, UserPage, UserPatch, UsersFilter } from "./user-types";

@Entity("users")
export class UserEntity extends BaseEntity {
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
  displayName: string;

  @Column()
  handle: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  accountType: AccountType;

  @Column()
  strikes: number;
};

const mapEntity = (columns: ColumnMetadata[], obj: object): User => {
  if (!obj) return null;

  const res = {};
  for (const column of columns) {
    res[column.propertyName] = obj[column.databaseName];
  }

  return res as User;
};

export class UsersTable {
  private usersRepository: Repository<UserEntity>;

  constructor(
    private db: DataSource,
  ) {
    this.usersRepository = db.getRepository(UserEntity);
  };

  filterQuery = (filter: UsersFilter) => {
    let query = this.usersRepository.createQueryBuilder("users");

    if (filter?.accountType) {
      query = query.where('users.account_type = :accountType');
    }
    if (filter?.strikes) {
      query = query.where({
        strikes: MoreThanOrEqual(3),
      });
    }

    return query.setParameters(filter);
  };

  total = async (filter: UsersFilter): Promise<number> => {
    return await this.filterQuery(filter).getCount();
  };

  create = async (input: UserInput): Promise<User> => {
    return await this.usersRepository.create(input).save();
  };

  get = async (id: string): Promise<User> => {
    return await this.usersRepository.find({
      where: {
        id,
      }
    }).then(res => res[0]);
  };

  find = async (filter: UsersFilter): Promise<UserPage> => {
    let page: UserPage = {
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

  patch = async (patch: UserPatch): Promise<User> => {
    return await this.usersRepository
      .createQueryBuilder('users')
      .update(UserEntity)
      .set(patch)
      .where('id = :id', { id: patch.id })
      .returning('*')
      .execute()
      .then(async res => {
        const meta = await this.db.getMetadata(UserEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };

  delete = async (id: string) => {
    return await this.usersRepository
      .createQueryBuilder('bubbles')
      .update(UserEntity)
      .set({
        updatedAt: () => 'now()',
        deletedAt: () => 'now()',
      })
      .where('id = :id', { id })
      .returning('*')
      .execute()
      .then(res => {
        const meta = this.db.getMetadata(UserEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };
};