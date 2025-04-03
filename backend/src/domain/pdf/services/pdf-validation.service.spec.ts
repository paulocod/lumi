import { Test, TestingModule } from '@nestjs/testing';
import { PdfValidationService } from './pdf-validation.service';
import { LoggerService } from '../../../config/logger.service';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';

describe('PdfValidationService', () => {
  let service: PdfValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfValidationService,
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PdfValidationService>(PdfValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateExtractedData', () => {
    it('should validate a valid invoice data', () => {
      const validData: Partial<CreateInvoiceDto> = {
        clientNumber: '7204076116',
        referenceMonth: new Date('2024-01-01'),
        electricityQuantity: 50,
        electricityValue: 47.75,
        sceeQuantity: 456,
        sceeValue: 235.42,
        compensatedEnergyQuantity: 456,
        compensatedEnergyValue: -225.42,
        publicLightingValue: 49.43,
      };

      const result = service.validateExtractedData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(validData);
    });

    it('should invalidate data with missing client number', () => {
      const invalidData: Partial<CreateInvoiceDto> = {
        referenceMonth: new Date('2024-01-01'),
        electricityQuantity: 50,
        electricityValue: 47.75,
      };

      const result = service.validateExtractedData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Número do cliente inválido');
      expect(result.data).toBeUndefined();
    });

    it('should invalidate data with negative values', () => {
      const invalidData: Partial<CreateInvoiceDto> = {
        clientNumber: '7204076116',
        referenceMonth: new Date('2024-01-01'),
        electricityQuantity: -50,
        electricityValue: 47.75,
      };

      const result = service.validateExtractedData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Quantidade de energia elétrica inválida',
      );
      expect(result.data).toBeUndefined();
    });

    it('should handle validation errors gracefully', () => {
      const result = service.validateExtractedData({});

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
    });
  });
});
