import { registerEnumType } from '@nestjs/graphql';

export enum TimeOffStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING_SYNC = 'PENDING_SYNC',
  APPROVED = 'APPROVED',
  REJECTED_BY_ADMIN = 'REJECTED_BY_ADMIN',
  REJECTED_BY_HCM = 'REJECTED_BY_HCM',
  SYNC_FAILED = 'SYNC_FAILED',
}

registerEnumType(TimeOffStatus, {
  name: 'TimeOffStatus',
});
