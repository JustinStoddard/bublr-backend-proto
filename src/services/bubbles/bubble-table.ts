import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { Bubble, BubbleInput, BubblePage, BubblePatch, BubblesFilter } from "./bubble-types";

@Entity("bubbles")
export class BubbleEntity extends BaseEntity {
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
  name: string;

  @Column()
  longitude: string;

  @Column()
  latitude: string;

  @Column()
  radius: string;
};

const mapEntity = (columns: ColumnMetadata[], obj: object): Bubble => {
  if (!obj) return null;

  const res = {};
  for (const column of columns) {
    res[column.propertyName] = obj[column.databaseName];
  }

  return res as Bubble;
};

export class BubblesTable {
  private bubblesRepository: Repository<BubbleEntity>;

  constructor(
    private db: DataSource,
  ) {
    this.bubblesRepository = db.getRepository(BubbleEntity);
  };

  filterQuery = (filter: BubblesFilter) => {
    let query = this.bubblesRepository.createQueryBuilder("bubbles");

    if (filter?.ownerId) {
      query = query.where('bubbles.owner_id = :ownerId');
    }

    return query.setParameters(filter);
  };

  total = async (filter: BubblesFilter): Promise<number> => {
    return await this.filterQuery(filter).getCount();
  };

  create = async (input: BubbleInput): Promise<Bubble> => {
    return await this.bubblesRepository.create(input).save();
  };

  get = async (id: string): Promise<Bubble> => {
    return await this.bubblesRepository.find({
      where: {
        id,
      }
    }).then(res => res[0]);
  };

  find = async (filter: BubblesFilter): Promise<BubblePage> => {
    let page: BubblePage = {
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

  patch = async (patch: BubblePatch): Promise<Bubble> => {
    return await this.bubblesRepository
      .createQueryBuilder('bubbles')
      .update(BubbleEntity)
      .set(patch)
      .where('id = :id', { id: patch.id })
      .returning('*')
      .execute()
      .then(async res => {
        const meta = await this.db.getMetadata(BubbleEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };

  delete = async (id: string) => {
    return await this.bubblesRepository
      .createQueryBuilder('bubbles')
      .update(BubbleEntity)
      .set({
        updatedAt: () => 'now()',
        deletedAt: () => 'now()',
      })
      .where('id = :id', { id })
      .returning('*')
      .execute()
      .then(res => {
        const meta = this.db.getMetadata(BubbleEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };
};