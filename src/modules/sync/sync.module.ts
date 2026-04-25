import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeOffRequest } from '../time-off/entities/time-off-request.entity';
import { TimeOffBalance } from '../time-off/entities/time-off-balance.entity';
import { SyncMutationService } from './services/sync.mutation.service';
import { SyncReadService } from './services/sync.read.service';
import { SyncResolver } from './resolvers/sync.resolver';

@Module({
  imports: [
    // Required to make HTTP calls to the HCM Mock
    HttpModule,
    // Required to update request status and balance
    TypeOrmModule.forFeature([TimeOffRequest, TimeOffBalance]),
  ],
  providers: [SyncMutationService, SyncReadService, SyncResolver],
})
export class SyncModule {}
