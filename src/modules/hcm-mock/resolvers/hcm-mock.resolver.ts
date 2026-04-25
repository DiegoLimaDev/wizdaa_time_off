// src/modules/hcm-mock/resolvers/hcm-mock.resolver.ts
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { HcmMockReadService } from '../services/hcm-mock.read.service';
import { HcmMockMutationService } from '../services/hcm-mock.mutation.service';
import { SyncResult } from '../../sync/interface/syncResult.interface';
import { HcmSyncInput } from '../dto/hcm-sync.input';

@Resolver()
export class HcmMockResolver {
  constructor(
    // Injecting specialized services directly, skipping the orchestrator
    private readonly readService: HcmMockReadService,
    private readonly mutationService: HcmMockMutationService,
  ) {}

  @Mutation(() => SyncResult)
  /**
   * Simulates the HCM logic directly within a GraphQL Mutation.
   * Validates input via ReadService and generates success via MutationService.
   */
  async mockHcmSync(@Args('input') input: HcmSyncInput): Promise<SyncResult> {
    console.log(
      `[HCM Mock Resolver] Processing request for: ${input.employeeId}`,
    );

    // 1. Logic check via Read Service (Validation)
    this.readService.validateAbsenceRequest(input);

    // 2. Specific 'bad-employee' logic from the old controller
    if (input.employeeId === 'bad-employee') {
      throw new BadRequestException({
        errorCode: 'INSUFFICIENT_FUNDS',
        message: 'Employee does not have enough accrued days in HCM record.',
      });
    }

    // 3. Simulated network delay (for realism)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Checking for random simulated failure
    if (this.readService.shouldSimulateFailure()) {
      throw new BadRequestException(
        'HCM Error: Simulated random business failure',
      );
    }

    // 5. Generating and returning the successful result via Mutation Service
    return this.mutationService.generateSuccessResponse();
  }
}
