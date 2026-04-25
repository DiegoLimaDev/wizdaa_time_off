// src/modules/sync/dto/sync-result.type.ts
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SyncResult {
  @Field()
  // Indicates if the batch or individual operation succeeded
  success: boolean;

  @Field({ nullable: true })
  // Total number of requests synchronized in this execution
  processedCount: number;

  @Field()
  // ISO Date string from the HCM or local server
  processedAt: string;

  @Field({ nullable: true })
  // The last reference ID generated (if applicable)
  hcmReferenceId?: string;

  @Field({ nullable: true })
  // General feedback message
  message?: string;
}
