// src/modules/sync/resolvers/sync.resolver.ts
import { Resolver, Mutation } from '@nestjs/graphql';
import { SyncReadService } from '../services/sync.read.service';
import { SyncMutationService } from '../services/sync.mutation.service';
import { SyncResult } from '../interface/syncResult.interface';

@Resolver()
export class SyncResolver {
  constructor(
    // Injecting the specialized services directly
    private readonly readService: SyncReadService,
    private readonly mutationService: SyncMutationService,
  ) {}

  @Mutation(() => SyncResult)
  /**
   * Coordinates the synchronization process by fetching pending requests
   * and processing them one by one through the mutation service.
   */
  async runSync(): Promise<SyncResult> {
    // 1. Fetch all requests with PENDING_SYNC status
    const pendingRequests = await this.readService.getPendingSyncRequests();

    // 2. Iterate and process each request via HCM API
    for (const request of pendingRequests) {
      await this.mutationService.syncWithHcm(request);
    }

    return {
      success: true,
      processedCount: pendingRequests.length,
      processedAt: new Date().toISOString(),
      message: 'Sync completed successfully',
    };
  }
}
