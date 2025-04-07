import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { PrismaInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository';
import { Cache } from 'cache-manager';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';
import { Invoice } from '@/modules/invoice/entities/invoice.entity';

jest.mock('@/modules/invoice/repositories/invoice.repository');
jest.mock('@nestjs/cache-manager');

describe('DashboardService', () => {
  let service: DashboardService;
  let invoiceRepository: jest.Mocked<PrismaInvoiceRepository>;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        PrismaInvoiceRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    invoiceRepository = module.get(PrismaInvoiceRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have required dependencies', () => {
    expect(invoiceRepository).toBeDefined();
    expect(cacheManager).toBeDefined();
  });

  describe('getAllDashboardData', () => {
    it('deve retornar dados do cache quando disponível', async () => {
      const clientNumber = '123';
      const cachedData = {
        energyData: [],
        financialData: [],
        summary: {
          clientNumber: '123',
          totalElectricityConsumption: 450,
          totalCompensatedEnergy: 80,
          totalWithoutGD: 4800,
          totalGDSavings: 800,
          savingsPercentage: 16.67,
        },
      };

      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getAllDashboardData(clientNumber);

      expect(result).toEqual(cachedData);
      expect(cacheManager.get).toHaveBeenCalledWith('dashboard:all:123');
      expect(invoiceRepository.findAll.mock.calls.length).toBe(0);
    });

    it('deve buscar e processar dados quando não há cache', async () => {
      const clientNumber = '123';
      const mockInvoices = [
        {
          id: '1',
          clientNumber: '123',
          referenceMonth: new Date('2024-01-01'),
          electricityQuantity: 100,
          sceeQuantity: 50,
          compensatedEnergyQuantity: 30,
          electricityValue: 1000,
          sceeValue: 500,
          publicLightingValue: 100,
          compensatedEnergyValue: -300,
          status: InvoiceStatus.COMPLETED,
        } as Invoice,
        {
          id: '2',
          clientNumber: '123',
          referenceMonth: new Date('2024-01-01'),
          electricityQuantity: 200,
          sceeQuantity: 100,
          compensatedEnergyQuantity: 50,
          electricityValue: 2000,
          sceeValue: 1000,
          publicLightingValue: 200,
          compensatedEnergyValue: -500,
          status: InvoiceStatus.COMPLETED,
        } as Invoice,
      ];

      cacheManager.get.mockResolvedValue(null);
      invoiceRepository.findAll.mockResolvedValue({
        invoices: mockInvoices,
        total: mockInvoices.length,
      });

      const result = await service.getAllDashboardData(clientNumber);

      expect(result.energyData).toHaveLength(1);
      expect(result.financialData).toHaveLength(1);
      expect(result.summary).toEqual({
        clientNumber: '123',
        totalElectricityConsumption: 450,
        totalCompensatedEnergy: 80,
        totalWithoutGD: 4800,
        totalGDSavings: 800,
        savingsPercentage: 16.67,
      });

      expect(cacheManager.set).toHaveBeenCalledWith(
        'dashboard:all:123',
        expect.any(Object),
        3600,
      );
    });

    it('deve processar dados para todos os clientes quando clientNumber não é fornecido', async () => {
      const mockInvoices = [
        {
          id: '1',
          clientNumber: '123',
          referenceMonth: new Date('2024-01-01'),
          electricityQuantity: 100,
          sceeQuantity: 50,
          compensatedEnergyQuantity: 30,
          electricityValue: 1000,
          sceeValue: 500,
          publicLightingValue: 100,
          compensatedEnergyValue: -300,
          status: InvoiceStatus.COMPLETED,
        } as Invoice,
        {
          id: '2',
          clientNumber: '456',
          referenceMonth: new Date('2024-01-01'),
          electricityQuantity: 200,
          sceeQuantity: 100,
          compensatedEnergyQuantity: 50,
          electricityValue: 2000,
          sceeValue: 1000,
          publicLightingValue: 200,
          compensatedEnergyValue: -500,
          status: InvoiceStatus.COMPLETED,
        } as Invoice,
      ];

      cacheManager.get.mockResolvedValue(null);
      invoiceRepository.findAll.mockResolvedValue({
        invoices: mockInvoices,
        total: mockInvoices.length,
      });

      const result = await service.getAllDashboardData();

      expect(result.summary.clientNumber).toBe('Todos os clientes');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'dashboard:all:all',
        expect.any(Object),
        3600,
      );
    });
  });

  describe('invalidateDashboardCache', () => {
    it('deve invalidar o cache para um cliente específico', async () => {
      await service.invalidateDashboardCache('123');
      expect(cacheManager.del).toHaveBeenCalledWith('dashboard:all:123');
    });

    it('deve invalidar o cache para todos os clientes', async () => {
      await service.invalidateDashboardCache();
      expect(cacheManager.del).toHaveBeenCalledWith('dashboard:all:all');
    });
  });
});
