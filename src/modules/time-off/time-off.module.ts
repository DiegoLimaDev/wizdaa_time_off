import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeOffBalance } from './entities/time-off-balance.entity';
import { TimeOffRequest } from './entities/time-off-request.entity';
import { SeedService } from './services/seed.service';
import { TimeOffReadService } from './services/time-off.read.service';
import { TimeOffMutationService } from './services/time-off.mutation.service';
import { TimeOffResolver } from './resolvers/time-off.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([TimeOffBalance, TimeOffRequest])],
  // Register the service here
  providers: [
    TimeOffMutationService,
    TimeOffReadService,
    TimeOffResolver,
    SeedService,
  ],
  // Export it if other modules (like Sync) need to use its logic
  exports: [TimeOffReadService, TimeOffMutationService],
})
export class TimeOffModule {}
