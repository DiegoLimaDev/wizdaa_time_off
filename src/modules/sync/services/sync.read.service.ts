// src/modules/sync/services/sync-read.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffRequest } from '../../time-off/entities/time-off-request.entity';
import { TimeOffStatus } from '../../time-off/enums/time-off-status.enum';

@Injectable()
export class SyncReadService {
  constructor(
    @InjectRepository(TimeOffRequest)
    private readonly requestRepo: Repository<TimeOffRequest>,
  ) {}

  /**
   * Fetches all requests that are waiting to be sent to the HCM
   */
  async getPendingSyncRequests(): Promise<TimeOffRequest[]> {
    return await this.requestRepo.find({
      where: { status: TimeOffStatus.PENDING_SYNC },
      order: { createdAt: 'ASC' }, // Process older requests first
    });
  }
}
