// src/modules/time-off/services/time-off-mutation.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffRequest } from '../entities/time-off-request.entity';
import { CreateTimeOffInput } from '../dto/create-time-off.input';
import { TimeOffStatus } from '../enums/time-off-status.enum';
import { TimeOffReadService } from './time-off.read.service';
import { SyncBalanceInput } from '../../sync/dto/sync-balance.dto';
import { TimeOffBalance } from '../entities/time-off-balance.entity';

@Injectable()
export class TimeOffMutationService {
  constructor(
    @InjectRepository(TimeOffRequest)
    private readonly requestRepository: Repository<TimeOffRequest>,
    @InjectRepository(TimeOffBalance) // ADICIONAR ESTA LINHA
    private readonly balanceRepository: Repository<TimeOffBalance>,
    private readonly readService: TimeOffReadService,
  ) {}

  async createRequest(dto: CreateTimeOffInput): Promise<TimeOffRequest> {
    const { employeeId, locationId, requestedDays } = dto;

    // Validação usando o ReadService
    const balance = await this.readService.getBalance(employeeId, locationId);

    if (balance.availableDays < requestedDays) {
      throw new BadRequestException('Insufficient time-off balance');
    }

    const newRequest = this.requestRepository.create({
      ...dto,
      status: TimeOffStatus.PENDING_APPROVAL,
    });

    return await this.requestRepository.save(newRequest);
  }

  async approveRequest(id: string): Promise<TimeOffRequest> {
    const request = await this.requestRepository.findOneBy({ id });
    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== TimeOffStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot approve request with status ${request.status}`,
      );
    }

    request.status = TimeOffStatus.PENDING_SYNC;
    return await this.requestRepository.save(request);
  }

  async rejectRequest(id: string, reason: string): Promise<TimeOffRequest> {
    const request = await this.requestRepository.findOneBy({ id });
    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== TimeOffStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    request.status = TimeOffStatus.REJECTED_BY_ADMIN;
    request.errorMessage = reason;

    return await this.requestRepository.save(request);
  }

  async upsertBalances(balances: SyncBalanceInput[]): Promise<number> {
    let updatedCount = 0;

    for (const item of balances) {
      let balance = await this.balanceRepository.findOne({
        where: { employeeId: item.employeeId, locationId: item.locationId },
      });

      if (balance) {
        balance.availableDays = item.availableDays;
      } else {
        balance = this.balanceRepository.create(item);
      }

      await this.balanceRepository.save(balance);
      updatedCount++;
    }

    return updatedCount;
  }
}
