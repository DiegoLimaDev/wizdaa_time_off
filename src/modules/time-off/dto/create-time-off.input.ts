// src/modules/time-off/dto/create-time-off.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

@InputType()
export class CreateTimeOffInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @Field()
  @IsDateString()
  startDate: string;

  @Field()
  @IsDateString()
  endDate: string;

  @Field(() => Float)
  @IsNumber()
  requestedDays: number;
}
