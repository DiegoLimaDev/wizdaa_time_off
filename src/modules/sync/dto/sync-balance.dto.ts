// src/modules/time-off/dto/sync-balance.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class SyncBalanceInput {
  @Field()
  employeeId: string;

  @Field()
  locationId: string;

  @Field(() => Float)
  availableDays: number;
}
