import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TimeOffStatus } from '../enums/time-off-status.enum';

@ObjectType()
@Entity('time_off_request')
export class TimeOffRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  employeeId: string;

  @Field()
  @Column()
  locationId: string;

  @Field() // Datas em string (ISO) funcionam bem como strings no GraphQL
  @Column({ type: 'date' })
  startDate: string;

  @Field()
  @Column({ type: 'date' })
  endDate: string;

  @Field(() => Float)
  @Column('float')
  requestedDays: number;

  @Field(() => TimeOffStatus) // Usamos o Enum que registramos antes
  @Column({
    type: 'varchar',
    enum: TimeOffStatus,
    default: TimeOffStatus.PENDING_APPROVAL,
  })
  status: TimeOffStatus;

  @Field({ nullable: true }) // Definimos como opcional no GraphQL
  @Column({ nullable: true })
  hcmReferenceId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  errorMessage: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
