// src/modules/hcm-mock/dto/hcm-sync.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

@InputType()
export class HcmSyncInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  // Employee identifier from the source system
  employeeId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  // Start date in ISO format
  startDate: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  // End date in ISO format
  endDate: string;

  @Field(() => Int)
  @IsNumber()
  // Number of days to be registered in HCM
  days: number;
}
