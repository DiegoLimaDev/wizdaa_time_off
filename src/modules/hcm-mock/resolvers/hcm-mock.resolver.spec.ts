// src/modules/hcm-mock/resolvers/hcm-mock.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HcmMockResolver } from './hcm-mock.resolver';
import { HcmMockReadService } from '../services/hcm-mock.read.service';
import { HcmMockMutationService } from '../services/hcm-mock.mutation.service';
import { HcmSyncInput } from '../dto/hcm-sync.input';

describe('HcmMockResolver', () => {
  let resolver: HcmMockResolver;
  let readService: HcmMockReadService;
  let mutationService: HcmMockMutationService;

  // Mocks dos serviços especializados
  const mockReadService = {
    validateAbsenceRequest: jest.fn(),
    shouldSimulateFailure: jest.fn(),
  };

  const mockMutationService = {
    generateSuccessResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HcmMockResolver,
        { provide: HcmMockReadService, useValue: mockReadService },
        { provide: HcmMockMutationService, useValue: mockMutationService },
      ],
    }).compile();

    resolver = module.get<HcmMockResolver>(HcmMockResolver);
    readService = module.get<HcmMockReadService>(HcmMockReadService);
    mutationService = module.get<HcmMockMutationService>(
      HcmMockMutationService,
    );

    jest.useFakeTimers(); // Habilita o controle do tempo (setTimeout)
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('mockHcmSync', () => {
    const mockInput: HcmSyncInput = {
      employeeId: 'emp-123',
      days: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-06',
    };

    it('should return success when everything is valid', async () => {
      const mockSuccessResult = { success: true, hcmReferenceId: 'HCM-123' };

      // Setup: Validação passa e falha aleatória não ocorre
      mockReadService.shouldSimulateFailure.mockReturnValue(false);
      mockMutationService.generateSuccessResponse.mockReturnValue(
        mockSuccessResult,
      );

      const promise = resolver.mockHcmSync(mockInput);

      // Avança o cronômetro para ignorar o delay de 500ms
      jest.advanceTimersByTime(500);

      const result = await promise;

      expect(result).toEqual(mockSuccessResult);
      expect(readService.validateAbsenceRequest).toHaveBeenCalledWith(
        mockInput,
      );
      expect(mutationService.generateSuccessResponse).toHaveBeenCalled();
    });

    it('should throw BadRequestException for "bad-employee"', async () => {
      const badInput = { ...mockInput, employeeId: 'bad-employee' };

      await expect(resolver.mockHcmSync(badInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(resolver.mockHcmSync(badInput)).rejects.toThrow(
        'Employee does not have enough accrued days',
      );
    });

    it('should throw BadRequestException when random failure is triggered', async () => {
      // Setup: A validação passa, mas o "dado" da sorte diz que deve falhar
      mockReadService.shouldSimulateFailure.mockReturnValue(true);

      const promise = resolver.mockHcmSync(mockInput);
      jest.advanceTimersByTime(500);

      await expect(promise).rejects.toThrow(
        'HCM Error: Simulated random business failure',
      );
    });

    it('should call validateAbsenceRequest before processing', async () => {
      mockReadService.shouldSimulateFailure.mockReturnValue(false);

      const promise = resolver.mockHcmSync(mockInput);
      jest.advanceTimersByTime(500);
      await promise;

      expect(readService.validateAbsenceRequest).toHaveBeenCalled();
    });
  });
});
