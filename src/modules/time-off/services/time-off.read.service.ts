// src/modules/time-off/services/time-off-read.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffBalance } from '../entities/time-off-balance.entity';
import { TimeOffRequest } from '../entities/time-off-request.entity';
import { TimeOffStatus } from '../enums/time-off-status.enum';

@Injectable()
export class TimeOffReadService {
  constructor(
    @InjectRepository(TimeOffBalance)
    private readonly balanceRepository: Repository<TimeOffBalance>,
    @InjectRepository(TimeOffRequest)
    private readonly requestRepository: Repository<TimeOffRequest>,
  ) {}

  async getBalance(
    employeeId: string,
    locationId: string,
  ): Promise<TimeOffBalance> {
    const balance = await this.balanceRepository.findOne({
      where: { employeeId, locationId },
    });

    if (!balance) {
      throw new NotFoundException(
        `Balance not found for employee ${employeeId}`,
      );
    }
    return balance;
  }

  async findAllRequests(status?: TimeOffStatus): Promise<TimeOffRequest[]> {
    return await this.requestRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }
}
