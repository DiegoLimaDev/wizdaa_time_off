// src/modules/sync/services/sync-mutation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { TimeOffRequest } from '../../time-off/entities/time-off-request.entity';
import { TimeOffBalance } from '../../time-off/entities/time-off-balance.entity';
import { TimeOffStatus } from '../../time-off/enums/time-off-status.enum';
import { SyncMutationService } from './sync.mutation.service';

describe('SyncMutationService', () => {
  let service: SyncMutationService;
  let requestRepo: any;
  let balanceRepo: any;
  let httpService: HttpService;

  const mockRequest = {
    id: 'req-1',
    employeeId: 'emp-123',
    locationId: 'loc-1',
    requestedDays: 5,
    startDate: '2026-05-01',
    endDate: '2026-05-06',
    status: TimeOffStatus.PENDING_SYNC,
  } as TimeOffRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncMutationService,
        {
          provide: getRepositoryToken(TimeOffRequest),
          useValue: {
            save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
          },
        },
        {
          provide: getRepositoryToken(TimeOffBalance),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
          },
        },
        {
          provide: HttpService,
          useValue: { post: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SyncMutationService>(SyncMutationService);
    requestRepo = module.get(getRepositoryToken(TimeOffRequest));
    balanceRepo = module.get(getRepositoryToken(TimeOffBalance));
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncWithHcm', () => {
    it('should approve request and deduct balance on successful HCM response', async () => {
      // 1. Mock do Sucesso da API (Axios retorna um Observable)
      const axiosResponse: Partial<AxiosResponse> = {
        status: 200,
        data: { hcmReferenceId: 'HCM-REF-999' },
      };
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of(axiosResponse as AxiosResponse));

      // 2. Mock do Saldo existente
      const mockBalance = {
        employeeId: 'emp-123',
        availableDays: 20,
      } as TimeOffBalance;
      balanceRepo.findOne.mockResolvedValue(mockBalance);

      await service.syncWithHcm(mockRequest);

      // Verificações
      expect(mockRequest.status).toBe(TimeOffStatus.APPROVED);
      expect(mockRequest.hcmReferenceId).toBe('HCM-REF-999');
      expect(mockBalance.availableDays).toBe(15); // 20 - 5
      expect(balanceRepo.save).toHaveBeenCalledWith(mockBalance);
      expect(requestRepo.save).toHaveBeenCalledWith(mockRequest);
    });

    // Adicione estes testes dentro do describe('syncWithHcm') no seu arquivo de teste existente

    it('should approve request and work correctly with status 201 (Created)', async () => {
      const axiosResponse: Partial<AxiosResponse> = {
        status: 201,
        data: { hcmReferenceId: 'HCM-REF-201' },
      };
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of(axiosResponse as AxiosResponse));
      balanceRepo.findOne.mockResolvedValue({
        employeeId: 'emp-123',
        availableDays: 10,
      });

      await service.syncWithHcm(mockRequest);

      expect(mockRequest.status).toBe(TimeOffStatus.APPROVED);
      expect(mockRequest.hcmReferenceId).toBe('HCM-REF-201');
    });

    it('should not deduct balance if balance record is not found', async () => {
      const axiosResponse: Partial<AxiosResponse> = {
        status: 200,
        data: { hcmReferenceId: 'HCM-REF-999' },
      };
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of(axiosResponse as AxiosResponse));

      // Simula que o saldo não foi encontrado no banco
      balanceRepo.findOne.mockResolvedValue(null);

      await service.syncWithHcm(mockRequest);

      expect(mockRequest.status).toBe(TimeOffStatus.APPROVED);
      // Garante que o save do balance NUNCA foi chamado
      expect(balanceRepo.save).not.toHaveBeenCalled();
    });

    it('should fallback to default message when HCM returns 400 without a message body', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: {}, // Sem campo 'message'
        },
        isAxiosError: true,
      } as AxiosError;

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      await service.syncWithHcm(mockRequest);

      expect(mockRequest.status).toBe(TimeOffStatus.REJECTED_BY_HCM);
      expect(mockRequest.errorMessage).toBe('Rejected by HCM rules'); // Mensagem de fallback
    });

    it('should handle errors where response object is completely missing (Network Timeout)', async () => {
      const axiosError = {
        message: 'Network Error',
        isAxiosError: true,
        // response: undefined -> Simula queda de conexão onde não há status code
      } as AxiosError;

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      await service.syncWithHcm(mockRequest);

      expect(mockRequest.status).toBe(TimeOffStatus.SYNC_FAILED);
      expect(mockRequest.errorMessage).toBe('HCM Connection Failure');
    });

    it('should handle HCM 400 error and set REJECTED_BY_HCM status', async () => {
      // 1. Simula erro 400 vindo do HCM
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Inconsistent dates' },
        },
        isAxiosError: true,
      } as AxiosError;

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      await service.syncWithHcm(mockRequest);

      // Verificações
      expect(mockRequest.status).toBe(TimeOffStatus.REJECTED_BY_HCM);
      expect(mockRequest.errorMessage).toBe('Inconsistent dates');
      expect(balanceRepo.save).not.toHaveBeenCalled(); // Não deve mexer no saldo
      expect(requestRepo.save).toHaveBeenCalled();
    });

    it('should handle network/server errors and set SYNC_FAILED status', async () => {
      // 1. Simula erro genérico (500 ou queda de conexão)
      const axiosError = {
        response: { status: 500 },
        isAxiosError: true,
      } as AxiosError;

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      await service.syncWithHcm(mockRequest);

      // Verificações
      expect(mockRequest.status).toBe(TimeOffStatus.SYNC_FAILED);
      expect(mockRequest.errorMessage).toBe('HCM Connection Failure');
      expect(requestRepo.save).toHaveBeenCalled();
    });
  });
});
