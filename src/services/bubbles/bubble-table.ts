import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, IsNull, JoinTable, ManyToMany, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { Bubble, BubbleInput, BubblePage, BubblePatch, BubblesFilter } from "./bubble-types";
import { MessageEntity } from "../messages/message-table";

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

  @Column({ type: 'text' })
  ownerId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  radius: number;

  @ManyToMany(() => MessageEntity, { cascade: true })
  @JoinTable({
    name: 'bubbles_messages',
    joinColumn: { name: 'bubbleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'messageId', referencedColumnName: 'id' },
  })
  messages: MessageEntity[];
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

  private calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const earthRadiusKm = 6371; // Earth's radius in kilometers
  
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;
  
    return distance;
  }
  
  private toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  }

  bubblesNearParentBubble = async (parentBubble: Bubble): Promise<Bubble[]> => {
    const radiusMiles = 25;
    const radiusKilometers = radiusMiles * 1.60934;

    console.log("radius kilometers", radiusKilometers);

    const nearbyBubbles: Bubble[] = await this.bubblesRepository
      .createQueryBuilder("bubbles")
      .where(
        `(6371 * acos(cos(radians(:parentLat)) * cos(radians(bubbles.latitude)) * cos(radians(bubbles.longitude) - radians(:parentLong)) + sin(radians(:parentLat)) * sin(radians(bubbles.latitude)))) <= :radius`,
        {
          parentLat: parentBubble.latitude,
          parentLong: parentBubble.longitude,
          radius: radiusKilometers,
        }
      )
      .andWhere('bubbles.id != :id', { id: parentBubble.id })
      .leftJoinAndSelect('bubbles.messages', 'messages')
      .getMany();

    return nearbyBubbles;
  };

  bubblesIntersectingWithParentBubble = async (id: string): Promise<Bubble[]> => {
    const parentBubble = await this.get(id);
    const nearbyBubbles = await this.bubblesNearParentBubble(parentBubble);

    const intersectingBubbles: Bubble[] = nearbyBubbles.filter(async bubble => {
      const distanceBetweenCenters = this.calculateDistance(
        parentBubble.latitude,
        parentBubble.longitude,
        bubble.latitude,
        bubble.longitude
      );

      const parentBubblesRadiusKilometers = parentBubble.radius * 1.60934;
      const bubbleRadiusKilometers = bubble.radius * 1.60934;

      const sumOfRadii = parentBubblesRadiusKilometers + bubbleRadiusKilometers;

      // Check if the circles intersect based on their distances and radii
      return distanceBetweenCenters <= sumOfRadii;
    });

    return [...intersectingBubbles, parentBubble];
  };

  filterQuery = (filter: BubblesFilter) => {
    let query = this.bubblesRepository.createQueryBuilder("bubbles");

    if (filter?.ownerId) {
      query = query.where('bubbles.owner_id = :ownerId');
    }

    return query.setParameters(filter);
  };

  saveBubbles = async (bubbles: Bubble[]): Promise<Bubble[]> => {
    return await this.bubblesRepository.save(bubbles);
  };

  total = async (filter: BubblesFilter): Promise<number> => {
    return await this.filterQuery(filter).getCount();
  };

  create = async (input: BubbleInput): Promise<Bubble> => {
    return await this.bubblesRepository.create(input).save();
  };

  get = async (id: string): Promise<Bubble> => {
    const bubble =  await this.bubblesRepository.find({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['messages'],
    }).then(res => res[0]);

    if (bubble.messages) {
      bubble.messages = bubble.messages.filter(message => message.deletedAt === null);
    }
    return bubble;
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
      .where('id = :id and deleted_at is null', { id: patch.id })
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
      .where('id = :id and deleted_at is null', { id })
      .returning('*')
      .execute()
      .then(res => {
        const meta = this.db.getMetadata(BubbleEntity);
        return mapEntity(meta.columns, res.raw[0]);
      });
  };
};