import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType() // Indica que esta classe é um tipo no GraphQL
@Entity('time_off_balance')
export class TimeOffBalance {
  @Field(() => ID) // No GraphQL, o ID é um scalar especial
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  employeeId: string;

  @Field()
  @Column()
  locationId: string;

  @Field(() => Float) // Especificamos Float para garantir precisão
  @Column('float', { default: 0 })
  availableDays: number;

  @Field()
  @UpdateDateColumn()
  lastSyncedAt: Date;
}
