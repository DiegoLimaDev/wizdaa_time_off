// src/modules/sync/services/sync-read.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffRequest } from '../../time-off/entities/time-off-request.entity';
import { TimeOffStatus } from '../../time-off/enums/time-off-status.enum';
import { SyncReadService } from './sync.read.service';

describe('SyncReadService', () => {
  let service: SyncReadService;

  // Mock do Repositório do TypeORM
  const mockRequestRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncReadService,
        {
          // Precisamos usar o token do TypeORM para injetar o mock corretamente
          provide: getRepositoryToken(TimeOffRequest),
          useValue: mockRequestRepo,
        },
      ],
    }).compile();

    service = module.get<SyncReadService>(SyncReadService);
    repo = module.get<Repository<TimeOffRequest>>(
      getRepositoryToken(TimeOffRequest),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPendingSyncRequests', () => {
    it('should fetch requests with PENDING_SYNC status ordered by creation date', async () => {
      // Dados mockados para simular o retorno do banco
      const mockRequests = [
        {
          id: 'uuid-1',
          employeeId: 'Leona',
          status: TimeOffStatus.PENDING_SYNC,
        },
        {
          id: 'uuid-2',
          employeeId: 'Software-Dev',
          status: TimeOffStatus.PENDING_SYNC,
        },
      ] as TimeOffRequest[];

      mockRequestRepo.find.mockResolvedValue(mockRequests);

      const result = await service.getPendingSyncRequests();

      // Verificações
      expect(result).toEqual(mockRequests);
      expect(result.length).toBe(2);

      // A parte mais importante: garantir que o filtro e a ordem foram passados corretamente
      expect(mockRequestRepo.find).toHaveBeenCalledWith({
        where: { status: TimeOffStatus.PENDING_SYNC },
        order: { createdAt: 'ASC' },
      });
    });

    it('should return an empty array if no pending requests are found', async () => {
      mockRequestRepo.find.mockResolvedValue([]);

      const result = await service.getPendingSyncRequests();

      expect(result).toEqual([]);
      expect(mockRequestRepo.find).toHaveBeenCalled();
    });
  });
});
