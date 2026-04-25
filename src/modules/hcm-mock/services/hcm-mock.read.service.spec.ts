// src/modules/hcm-mock/services/hcm-mock-read.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HcmSyncPayload } from '../interfaces/hcm-payload.interface';
import { HcmMockReadService } from './hcm-mock.read.service';

describe('HcmMockReadService', () => {
  let service: HcmMockReadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HcmMockReadService],
    }).compile();

    service = module.get<HcmMockReadService>(HcmMockReadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAbsenceRequest', () => {
    it('should not throw an error for a valid payload', () => {
      const validPayload: HcmSyncPayload = {
        employeeId: 'emp-123',
        days: 10,
        startDate: '2026-05-01',
        endDate: '2026-05-11',
      };

      // We expect it to run without throwing any exceptions
      expect(() => service.validateAbsenceRequest(validPayload)).not.toThrow();
    });

    it('should throw BadRequestException if employeeId is missing', () => {
      const invalidPayload = { days: 5 } as HcmSyncPayload;

      expect(() => service.validateAbsenceRequest(invalidPayload)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateAbsenceRequest(invalidPayload)).toThrow(
        'HCM Error: employeeId is required',
      );
    });

    it('should throw BadRequestException if days are zero or negative', () => {
      const invalidPayload = { employeeId: 'emp-1', days: 0 } as HcmSyncPayload;

      expect(() => service.validateAbsenceRequest(invalidPayload)).toThrow(
        'HCM Error: days must be greater than 0',
      );
    });

    it('should throw BadRequestException if days exceed the maximum limit (22)', () => {
      const invalidPayload = {
        employeeId: 'emp-1',
        days: 23,
      } as HcmSyncPayload;

      expect(() => service.validateAbsenceRequest(invalidPayload)).toThrow(
        'HCM Error: Absence exceeds maximum allowed days (22)',
      );
    });
  });

  describe('shouldSimulateFailure', () => {
    it('should return true when Math.random is below the threshold (0.1)', () => {
      // Force Math.random to return 0.05 (which is < 0.1)
      jest.spyOn(Math, 'random').mockReturnValue(0.05);

      const result = service.shouldSimulateFailure();
      expect(result).toBe(true);

      // Clean up the spy
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('should return false when Math.random is above the threshold', () => {
      // Force Math.random to return 0.5 (which is > 0.1)
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = service.shouldSimulateFailure();
      expect(result).toBe(false);

      jest.spyOn(Math, 'random').mockRestore();
    });
  });
});
