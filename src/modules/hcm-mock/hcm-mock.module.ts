import { Module } from '@nestjs/common';
import { HcmMockReadService } from './services/hcm-mock.read.service';
import { HcmMockMutationService } from './services/hcm-mock.mutation.service';
import { HcmMockResolver } from './resolvers/hcm-mock.resolver';

@Module({
  providers: [HcmMockReadService, HcmMockMutationService, HcmMockResolver],
})
export class HcmMockModule {}
