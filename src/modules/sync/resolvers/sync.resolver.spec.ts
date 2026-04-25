// src/modules/sync/resolvers/sync.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SyncResolver } from './sync.resolver';
import { SyncReadService } from '../services/sync.read.service';
import { SyncMutationService } from '../services/sync.mutation.service';
import { TimeOffRequest } from '../../time-off/entities/time-off-request.entity';

describe('SyncResolver', () => {
  let resolver: SyncResolver;
  let readService: SyncReadService;
  let mutationService: SyncMutationService;

  // Criamos os Mocks para os services especializados
  const mockSyncReadService = {
    getPendingSyncRequests: jest.fn(),
  };

  const mockSyncMutationService = {
    syncWithHcm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncResolver,
        { provide: SyncReadService, useValue: mockSyncReadService },
        { provide: SyncMutationService, useValue: mockSyncMutationService },
      ],
    }).compile();

    resolver = module.get<SyncResolver>(SyncResolver);
    readService = module.get<SyncReadService>(SyncReadService);
    mutationService = module.get<SyncMutationService>(SyncMutationService);

    // "Congelamos" o tempo para validar o processedAt
    jest.useFakeTimers().setSystemTime(new Date('2026-04-25T10:00:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('runSync', () => {
    it('should fetch pending requests and process each one', async () => {
      // 1. Setup: Simulamos 2 pedidos pendentes
      const mockRequests = [
        { id: 'req-1', employeeId: 'Diego' },
        { id: 'req-2', employeeId: 'Leona' },
      ] as TimeOffRequest[];

      mockSyncReadService.getPendingSyncRequests.mockResolvedValue(
        mockRequests,
      );
      mockSyncMutationService.syncWithHcm.mockResolvedValue(undefined);

      // 2. Execução
      const result = await resolver.runSync();

      // 3. Verificações
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.processedAt).toBe('2026-04-25T10:00:00.000Z');
      expect(result.message).toBe('Sync completed successfully');

      // Garantimos que a leitura foi feita uma vez
      expect(readService.getPendingSyncRequests).toHaveBeenCalledTimes(1);

      // Garantimos que a mutação foi chamada para CADA pedido do loop
      expect(mutationService.syncWithHcm).toHaveBeenCalledTimes(2);
      expect(mutationService.syncWithHcm).toHaveBeenNthCalledWith(
        1,
        mockRequests[0],
      );
      expect(mutationService.syncWithHcm).toHaveBeenNthCalledWith(
        2,
        mockRequests[1],
      );
    });

    it('should return zero processedCount when no requests are pending', async () => {
      // Setup: Lista vazia
      mockSyncReadService.getPendingSyncRequests.mockResolvedValue([]);

      const result = await resolver.runSync();

      expect(result.processedCount).toBe(0);
      expect(mutationService.syncWithHcm).not.toHaveBeenCalled();
    });
  });
});
