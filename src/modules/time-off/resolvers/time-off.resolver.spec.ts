// src/modules/time-off/resolvers/time-off.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TimeOffResolver } from './time-off.resolver';
import { TimeOffReadService } from '../services/time-off.read.service';
import { TimeOffMutationService } from '../services/time-off.mutation.service';
import { TimeOffStatus } from '../enums/time-off-status.enum';
import { CreateTimeOffInput } from '../dto/create-time-off.input';
import { SyncBalanceInput } from '../../sync/dto/sync-balance.dto';

describe('TimeOffResolver', () => {
  let resolver: TimeOffResolver;
  let readService: TimeOffReadService;
  let mutationService: TimeOffMutationService;

  // Mocks dos serviços especializados
  const mockReadService = {
    getBalance: jest.fn(),
    findAllRequests: jest.fn(),
  };

  const mockMutationService = {
    createRequest: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    upsertBalances: jest.fn(), // Novo método mockado
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffResolver,
        { provide: TimeOffReadService, useValue: mockReadService },
        { provide: TimeOffMutationService, useValue: mockMutationService },
      ],
    }).compile();

    resolver = module.get<TimeOffResolver>(TimeOffResolver);
    readService = module.get<TimeOffReadService>(TimeOffReadService);
    mutationService = module.get<TimeOffMutationService>(
      TimeOffMutationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  // --- QUERIES ---
  describe('Queries', () => {
    it('should call getBalance with correct arguments', async () => {
      const mockBalance = { employeeId: 'emp-123', availableDays: 15 };
      mockReadService.getBalance.mockResolvedValue(mockBalance);

      const result = await resolver.getBalance('emp-123', 'brazil-office');

      expect(result).toEqual(mockBalance);
      expect(readService.getBalance).toHaveBeenCalledWith(
        'emp-123',
        'brazil-office',
      );
    });

    it('should call findAll with a specific status', async () => {
      mockReadService.findAllRequests.mockResolvedValue([]);
      await resolver.findAll(TimeOffStatus.APPROVED);
      expect(readService.findAllRequests).toHaveBeenCalledWith(
        TimeOffStatus.APPROVED,
      );
    });

    it('should call findAll without status (null/undefined)', async () => {
      mockReadService.findAllRequests.mockResolvedValue([]);
      await resolver.findAll();
      expect(readService.findAllRequests).toHaveBeenCalledWith(undefined);
    });
  });

  // --- MUTATIONS ---
  describe('Mutations', () => {
    it('should call createRequest with input DTO', async () => {
      const input: CreateTimeOffInput = {
        employeeId: 'emp-123',
        locationId: 'loc-1',
        requestedDays: 2,
        startDate: '2026-05-01',
        endDate: '2026-05-03',
      };
      mockMutationService.createRequest.mockResolvedValue({
        id: 'req-1',
        ...input,
      });

      const result = await resolver.createRequest(input);

      expect(result.id).toBe('req-1');
      expect(mutationService.createRequest).toHaveBeenCalledWith(input);
    });

    it('should call approveRequest with correct ID', async () => {
      mockMutationService.approveRequest.mockResolvedValue({
        id: 'req-1',
        status: 'APPROVED',
      });
      const result = await resolver.approveRequest('req-1');
      expect(result.id).toBe('req-1');
      expect(mutationService.approveRequest).toHaveBeenCalledWith('req-1');
    });

    it('should call rejectRequest with ID and reason', async () => {
      mockMutationService.rejectRequest.mockResolvedValue({
        id: 'req-1',
        status: 'REJECTED',
      });
      const result = await resolver.rejectRequest('req-1', 'Not enough staff');
      expect(result.status).toBe('REJECTED');
      expect(mutationService.rejectRequest).toHaveBeenCalledWith(
        'req-1',
        'Not enough staff',
      );
    });

    it('should call syncBalancesFromHcm and return the count of processed items', async () => {
      const balances: SyncBalanceInput[] = [
        { employeeId: 'emp-1', locationId: 'loc-1', availableDays: 20 },
        { employeeId: 'emp-2', locationId: 'loc-1', availableDays: 10 },
      ];
      mockMutationService.upsertBalances.mockResolvedValue(2);

      const result = await resolver.syncBalancesFromHcm(balances);

      expect(result).toBe(2);
      expect(mutationService.upsertBalances).toHaveBeenCalledWith(balances);
    });
  });
});
