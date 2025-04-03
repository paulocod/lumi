import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { IInvoiceRepository } from '@/domain/invoice/repositories/invoice.repository';
import { Invoice } from '@/domain/invoice/entities/invoice.entity';
import { InvoiceStatus } from '@/domain/invoice/enums/invoice-status.enum';

describe('DashboardService', () => {
  let service: DashboardService;
  let invoiceRepository: jest.Mocked<IInvoiceRepository>;

  beforeEach(async () => {
    const mockInvoiceRepository = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: 'IInvoiceRepository',
          useValue: mockInvoiceRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    invoiceRepository = module.get('IInvoiceRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEnergyData', () => {
    it('should return energy data correctly', async () => {
      const mockInvoices: Partial<Invoice>[] = [
        {
          id: '1',
          clientNumber: '7204076116',
          electricityQuantity: 50,
          sceeQuantity: 476,
          compensatedEnergyQuantity: 476,
          referenceMonth: new Date('2024-03-01'),
          electricityValue: 47.75,
          sceeValue: 235.42,
          compensatedEnergyValue: -225.42,
          publicLightingValue: 49.43,
          status: InvoiceStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      invoiceRepository.findAll.mockResolvedValue({
        invoices: mockInvoices as Invoice[],
        total: mockInvoices.length,
      });

      const result = await service.getEnergyData();

      expect(result).toEqual([
        {
          electricityConsumption: 526,
          compensatedEnergy: 476,
          month: new Date('2024-03-01'),
        },
      ]);
    });
  });

  describe('getFinancialData', () => {
    it('should return financial data correctly', async () => {
      const mockInvoices: Partial<Invoice>[] = [
        {
          id: '1',
          clientNumber: '7204076116',
          electricityQuantity: 50,
          sceeQuantity: 476,
          compensatedEnergyQuantity: 476,
          referenceMonth: new Date('2024-03-01'),
          electricityValue: 47.75,
          sceeValue: 235.42,
          compensatedEnergyValue: -225.42,
          publicLightingValue: 49.43,
          status: InvoiceStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      invoiceRepository.findAll.mockResolvedValue({
        invoices: mockInvoices as Invoice[],
        total: mockInvoices.length,
      });

      const result = await service.getFinancialData();

      expect(result).toEqual([
        {
          totalWithoutGD: 332.6,
          gdSavings: 225.42,
          month: new Date('2024-03-01'),
        },
      ]);
    });
  });
});
