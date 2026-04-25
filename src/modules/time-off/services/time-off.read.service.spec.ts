// src/modules/time-off/services/time-off-read.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TimeOffBalance } from '../entities/time-off-balance.entity';
import { TimeOffRequest } from '../entities/time-off-request.entity';
import { TimeOffStatus } from '../enums/time-off-status.enum';
import { TimeOffReadService } from './time-off.read.service';

describe('TimeOffReadService', () => {
  let service: TimeOffReadService;
  let balanceRepo: Repository<TimeOffBalance>;
  let requestRepo: Repository<TimeOffRequest>;

  // Mocks dos repositórios
  const mockBalanceRepo = {
    findOne: jest.fn(),
  };

  const mockRequestRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffReadService,
        {
          provide: getRepositoryToken(TimeOffBalance),
          useValue: mockBalanceRepo,
        },
        {
          provide: getRepositoryToken(TimeOffRequest),
          useValue: mockRequestRepo,
        },
      ],
    }).compile();

    service = module.get<TimeOffReadService>(TimeOffReadService);
    balanceRepo = module.get<Repository<TimeOffBalance>>(
      getRepositoryToken(TimeOffBalance),
    );
    requestRepo = module.get<Repository<TimeOffRequest>>(
      getRepositoryToken(TimeOffRequest),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    const empId = 'emp-1';
    const locId = 'loc-1';

    it('should return balance when found', async () => {
      const mockBalance = {
        employeeId: empId,
        availableDays: 15,
      } as TimeOffBalance;
      mockBalanceRepo.findOne.mockResolvedValue(mockBalance);

      const result = await service.getBalance(empId, locId);

      expect(result).toEqual(mockBalance);
      expect(balanceRepo.findOne).toHaveBeenCalledWith({
        where: { employeeId: empId, locationId: locId },
      });
    });

    it('should throw NotFoundException when balance is not found', async () => {
      mockBalanceRepo.findOne.mockResolvedValue(null);

      await expect(service.getBalance(empId, locId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getBalance(empId, locId)).rejects.toThrow(
        `Balance not found for employee ${empId}`,
      );
    });
  });

  describe('findAllRequests', () => {
    const mockRequests = [
      { id: '1', status: TimeOffStatus.APPROVED },
      { id: '2', status: TimeOffStatus.PENDING_SYNC },
    ] as TimeOffRequest[];

    it('should return all requests without filter when status is not provided', async () => {
      mockRequestRepo.find.mockResolvedValue(mockRequests);

      const result = await service.findAllRequests();

      expect(result).toEqual(mockRequests);
      expect(requestRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
    });

    it('should return filtered requests when status is provided', async () => {
      const status = TimeOffStatus.PENDING_SYNC;
      mockRequestRepo.find.mockResolvedValue([mockRequests[1]]);

      const result = await service.findAllRequests(status);

      expect(result).toEqual([mockRequests[1]]);
      expect(requestRepo.find).toHaveBeenCalledWith({
        where: { status },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
