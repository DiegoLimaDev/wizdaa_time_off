// src/modules/time-off/services/time-off-mutation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TimeOffReadService } from './time-off.read.service';
import { TimeOffRequest } from '../entities/time-off-request.entity';
import { TimeOffBalance } from '../entities/time-off-balance.entity';
import { TimeOffStatus } from '../enums/time-off-status.enum';
import { CreateTimeOffInput } from '../dto/create-time-off.input';
import { TimeOffMutationService } from './time-off.mutation.service';

describe('TimeOffMutationService', () => {
  let service: TimeOffMutationService;
  let requestRepo: Repository<TimeOffRequest>;

  // Mock para o Repositório de Requests
  const mockRequestRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((val) => Promise.resolve({ id: 'uuid-123', ...val })),
    findOneBy: jest.fn(),
  };

  // Mock para o Repositório de Balances (Necessário para o Batch Sync)
  const mockBalanceRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
  };

  // Mock para o Read Service
  const mockReadService = {
    getBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffMutationService,
        {
          provide: getRepositoryToken(TimeOffRequest),
          useValue: mockRequestRepo,
        },
        {
          provide: getRepositoryToken(TimeOffBalance),
          useValue: mockBalanceRepo,
        },
        {
          provide: TimeOffReadService,
          useValue: mockReadService,
        },
      ],
    }).compile();

    service = module.get<TimeOffMutationService>(TimeOffMutationService);
    requestRepo = module.get<Repository<TimeOffRequest>>(
      getRepositoryToken(TimeOffRequest),
    );
    balanceRepo = module.get<Repository<TimeOffBalance>>(
      getRepositoryToken(TimeOffBalance),
    );
    readService = module.get<TimeOffReadService>(TimeOffReadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    const input: CreateTimeOffInput = {
      employeeId: 'emp-1',
      locationId: 'loc-1',
      requestedDays: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-06',
    };

    it('should create a request when balance is sufficient', async () => {
      mockReadService.getBalance.mockResolvedValue({ availableDays: 10 });

      const result = await service.createRequest(input);

      expect(result.status).toBe(TimeOffStatus.PENDING_APPROVAL);
      expect(requestRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      mockReadService.getBalance.mockResolvedValue({ availableDays: 2 });

      await expect(service.createRequest(input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createRequest(input)).rejects.toThrow(
        'Insufficient time-off balance',
      );
    });
  });

  describe('approveRequest', () => {
    it('should update status to PENDING_SYNC for a pending request', async () => {
      const mockRequest = {
        id: '1',
        status: TimeOffStatus.PENDING_APPROVAL,
      } as TimeOffRequest;
      mockRequestRepo.findOneBy.mockResolvedValue(mockRequest);

      const result = await service.approveRequest('1');

      expect(result.status).toBe(TimeOffStatus.PENDING_SYNC);
      expect(requestRepo.save).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw BadRequestException if request is not PENDING_APPROVAL', async () => {
      const mockRequest = {
        id: '1',
        status: TimeOffStatus.APPROVED,
      } as TimeOffRequest;
      mockRequestRepo.findOneBy.mockResolvedValue(mockRequest);

      await expect(service.approveRequest('1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if request does not exist', async () => {
      mockRequestRepo.findOneBy.mockResolvedValue(null);
      await expect(service.approveRequest('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rejectRequest', () => {
    it('should update status to REJECTED_BY_ADMIN and save the reason', async () => {
      const mockRequest = {
        id: '1',
        status: TimeOffStatus.PENDING_APPROVAL,
      } as TimeOffRequest;
      mockRequestRepo.findOneBy.mockResolvedValue(mockRequest);

      const result = await service.rejectRequest('1', 'Too many people off');

      expect(result.status).toBe(TimeOffStatus.REJECTED_BY_ADMIN);
      expect(result.errorMessage).toBe('Too many people off');
      expect(requestRepo.save).toHaveBeenCalled();
    });
  });

  describe('upsertBalances', () => {
    it('should update existing balances and create new ones (Batch Sync)', async () => {
      const input = [
        {
          employeeId: 'diego-123',
          locationId: 'brazil-office',
          availableDays: 25,
        }, // Já existe
        { employeeId: 'new-user', locationId: 'us-office', availableDays: 10 }, // Novo
      ];

      // Mock para o primeiro: acha o registro existente
      const existingBalance = {
        employeeId: 'diego-123',
        availableDays: 15,
      } as TimeOffBalance;
      mockBalanceRepo.findOne.mockResolvedValueOnce(existingBalance);

      // Mock para o segundo: não acha nada (null)
      mockBalanceRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.upsertBalances(input);

      // Verificações
      expect(result).toBe(2); // Processou dois itens

      // Verifica se atualizou o valor do existente
      expect(existingBalance.availableDays).toBe(25);

      // Verifica se tentou criar o novo
      expect(mockBalanceRepo.create).toHaveBeenCalledWith(input[1]);

      // Verifica se salvou ambos (o atualizado e o novo)
      expect(mockBalanceRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when the input list is empty', async () => {
      const result = await service.upsertBalances([]);
      expect(result).toBe(0);
      expect(mockBalanceRepo.save).not.toHaveBeenCalled();
    });
  });
});
