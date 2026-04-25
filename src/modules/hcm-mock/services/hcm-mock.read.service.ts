// src/modules/hcm-mock/services/hcm-mock-read.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { HcmSyncPayload } from '../interfaces/hcm-payload.interface';

@Injectable()
export class HcmMockReadService {
  /**
   * Validates if the incoming request follows HCM business rules.
   */
  validateAbsenceRequest(payload: HcmSyncPayload): void {
    // 1. Basic field validation
    if (!payload.employeeId) {
      throw new BadRequestException('HCM Error: employeeId is required');
    }

    if (!payload.days || payload.days <= 0) {
      throw new BadRequestException('HCM Error: days must be greater than 0');
    }

    // 2. Simulated business rule: maximum days per request
    const MAX_DAYS = 22;
    if (payload.days > MAX_DAYS) {
      throw new BadRequestException(
        `HCM Error: Absence exceeds maximum allowed days (${MAX_DAYS})`,
      );
    }
  }

  /**
   * Simulates a check to see if the system should fail randomly (for testing resilience).
   * Returns true if a failure should be simulated.
   */
  shouldSimulateFailure(): boolean {
    const FAILURE_PROBABILITY = 0.1; // 10% chance
    return Math.random() < FAILURE_PROBABILITY;
  }
}
