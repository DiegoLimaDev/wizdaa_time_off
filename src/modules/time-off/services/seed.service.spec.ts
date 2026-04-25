// src/modules/database/services/seed.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { TimeOffBalance } from '../entities/time-off-balance.entity';

describe('SeedService', () => {
  let service: SeedService;
  let repo: any;

  const mockRepo = {
    count: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: getRepositoryToken(TimeOffBalance),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    repo = module.get(getRepositoryToken(TimeOffBalance));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedBalances', () => {
    it('should NOT seed if database already has data', async () => {
      // Setup: Simula que já existem 2 registros no banco
      mockRepo.count.mockResolvedValue(2);

      await service.onModuleInit();

      expect(repo.count).toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should seed data if database is empty', async () => {
      // Setup: Simula banco vazio
      mockRepo.count.mockResolvedValue(0);
      mockRepo.save.mockResolvedValue([]);

      await service.onModuleInit();

      expect(repo.count).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();

      // Verifica se o primeiro item do seed tem o ID esperado
      const lastCall = mockRepo.save.mock.calls[0][0];
      expect(lastCall[0].employeeId).toBe('diego-123');
    });
  });
});
