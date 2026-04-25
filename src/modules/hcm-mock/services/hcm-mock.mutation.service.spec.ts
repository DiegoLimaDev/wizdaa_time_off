// src/modules/hcm-mock/services/hcm-mock-mutation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HcmMockMutationService } from './hcm-mock.mutation.service';

describe('HcmMockMutationService', () => {
  let service: HcmMockMutationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HcmMockMutationService],
    }).compile();

    service = module.get<HcmMockMutationService>(HcmMockMutationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSuccessResponse', () => {
    it('should return a valid SyncResult with correct formatting', () => {
      // 1. Mock do Math.random para prever o ID gerado
      // O valor 0.5 em base36 resulta em algo conhecido
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      // 2. Mock do Date para prever o processedAt
      const mockDate = new Date('2026-04-25T10:00:00.000Z');
      jest.useFakeTimers().setSystemTime(mockDate);

      const result = service.generateSuccessResponse();

      // Validações
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.message).toBe(
        'Absence registered successfully in HCM internal records',
      );

      // Verifica se o ID começa com o prefixo esperado
      expect(result.hcmReferenceId).toContain('HCM-REF-');

      // Verifica se a data é exatamente a que "congelamos" no mock
      expect(result.processedAt).toBe(mockDate.toISOString());
    });

    it('should generate a different hcmReferenceId on each call', () => {
      // Restauramos o mock para deixar a aleatoriedade agir
      jest.spyOn(Math, 'random').mockRestore();

      const result1 = service.generateSuccessResponse();
      const result2 = service.generateSuccessResponse();

      expect(result1.hcmReferenceId).not.toBe(result2.hcmReferenceId);
    });
  });
});
