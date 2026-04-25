// src/modules/hcm-mock/services/hcm-mock-mutation.service.ts
import { Injectable } from '@nestjs/common';
import { SyncResult } from '../../sync/interface/syncResult.interface';

@Injectable()
export class HcmMockMutationService {
  /**
   * Generates a successful response with a random HCM reference ID.
   */
  generateSuccessResponse(): SyncResult {
    const randomId = Math.random().toString(36).substring(2, 11).toUpperCase();

    return {
      success: true,
      hcmReferenceId: `HCM-REF-${randomId}`,
      processedAt: new Date().toISOString(),
      message: 'Absence registered successfully in HCM internal records',
      processedCount: 1,
    };
  }
}
