// src/modules/sync/services/sync-mutation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { TimeOffRequest } from '../../time-off/entities/time-off-request.entity';
import { TimeOffBalance } from '../../time-off/entities/time-off-balance.entity';
import { TimeOffStatus } from '../../time-off/enums/time-off-status.enum';
import { SyncResult } from '../interface/syncResult.interface';

@Injectable()
export class SyncMutationService {
  private readonly logger = new Logger(SyncMutationService.name);
  private readonly HCM_URL = 'http://localhost:3000/mock-hcm/sync-absence';

  constructor(
    @InjectRepository(TimeOffRequest)
    private readonly requestRepo: Repository<TimeOffRequest>,
    @InjectRepository(TimeOffBalance)
    private readonly balanceRepo: Repository<TimeOffBalance>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Synchronizes a single request with the HCM and updates internal state
   */
  async syncWithHcm(request: TimeOffRequest): Promise<void> {
    try {
      this.logger.log(`Executing sync for request ${request.id}`);

      const payload = {
        employeeId: request.employeeId,
        startDate: request.startDate,
        endDate: request.endDate,
        days: request.requestedDays,
      };

      // We now use SyncResult as the generic type for the HTTP call
      const response = await firstValueFrom(
        this.httpService.post<SyncResult>(this.HCM_URL, payload),
      );

      if (response.status === 200 || response.status === 201) {
        request.status = TimeOffStatus.APPROVED;
        // Accessing fields defined in the SyncResult class
        request.hcmReferenceId = response.data.hcmReferenceId!;

        await this.updateEmployeeBalance(
          request.employeeId,
          request.locationId,
          request.requestedDays,
        );
        this.logger.log(`Request ${request.id} synchronized successfully.`);
      }
    } catch (error) {
      this.handleSyncError(request, error as AxiosError);
    } finally {
      await this.requestRepo.save(request);
    }
  }

  /**
   * Internal helper to deduct days from the local balance cache
   */
  private async updateEmployeeBalance(
    empId: string,
    locId: string,
    days: number,
  ): Promise<void> {
    const balance = await this.balanceRepo.findOne({
      where: { employeeId: empId, locationId: locId },
    });

    if (balance) {
      balance.availableDays -= days;
      await this.balanceRepo.save(balance);
    }
  }

  /**
   * Handles external API errors and updates the request status
   */
  private handleSyncError(request: TimeOffRequest, error: AxiosError): void {
    const statusCode = error.response?.status;
    const responseData = error.response?.data as
      | { message?: string }
      | undefined;

    if (statusCode === 400) {
      request.status = TimeOffStatus.REJECTED_BY_HCM;
      request.errorMessage = responseData?.message || 'Rejected by HCM rules';
    } else {
      request.status = TimeOffStatus.SYNC_FAILED;
      request.errorMessage = 'HCM Connection Failure';
    }
    this.logger.error(
      `Sync failed for request ${request.id}: ${request.errorMessage}`,
    );
  }
}
