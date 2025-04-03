/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { LoggerService } from '../../config/logger.service';
import { PdfCacheService } from './services/pdf-cache.service';
import { PdfValidationService } from './services/pdf-validation.service';
import { PdfLayoutService } from './services/pdf-layout.service';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import {
  CachedExtraction,
  PdfExtractionError,
  InvoiceValidation,
} from './types/pdf-extraction.types';

describe('PdfService', () => {
  let service: PdfService;
  let cacheService: jest.Mocked<PdfCacheService>;
  let validationService: jest.Mocked<PdfValidationService>;
  let layoutService: jest.Mocked<PdfLayoutService>;

  beforeEach(async () => {
    const mockCacheService = {
      getCachedResult: jest.fn(),
      setCachedResult: jest.fn(),
    };

    const mockValidationService = {
      validateExtractedData: jest.fn(),
    };

    const mockLayoutService = {
      getLayouts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: PdfCacheService,
          useValue: mockCacheService,
        },
        {
          provide: PdfValidationService,
          useValue: mockValidationService,
        },
        {
          provide: PdfLayoutService,
          useValue: mockLayoutService,
        },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
    cacheService = module.get(PdfCacheService);
    validationService = module.get(PdfValidationService);
    layoutService = module.get(PdfLayoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const runTest = (testFn: () => Promise<void>) => {
    return testFn();
  };

  describe('extractInvoiceFromPdf', () => {
    const validInvoiceData: CreateInvoiceDto = {
      clientNumber: '7204076116',
      referenceMonth: new Date('2024-01-01'),
      electricityQuantity: 50,
      electricityValue: 47.75,
      sceeQuantity: 456,
      sceeValue: 235.42,
      compensatedEnergyQuantity: 456,
      compensatedEnergyValue: -225.42,
      publicLightingContribution: 49.43,
    };

    const mockLayout = {
      name: 'CEMIG',
      patterns: {},
      extract: jest.fn(),
    };

    it('should return cached result when available', () => {
      return runTest(async () => {
        const buffer = Buffer.from('test pdf content');
        const cachedData: CachedExtraction = {
          hash: 'test-hash',
          result: validInvoiceData,
          confidence: [],
          timestamp: new Date(),
        };

        cacheService.getCachedResult.mockResolvedValue(cachedData);

        const result = await service.extractInvoiceFromPdf(buffer);

        expect(result).toEqual(validInvoiceData);
        expect(cacheService.getCachedResult).toHaveBeenCalledWith(buffer);
      });
    });

    it('should extract and validate data when cache is empty', () => {
      return runTest(async () => {
        const buffer = Buffer.from('test pdf content');

        cacheService.getCachedResult.mockResolvedValue(null);
        layoutService.getLayouts.mockReturnValue([mockLayout]);
        mockLayout.extract.mockResolvedValue(validInvoiceData);
        validationService.validateExtractedData.mockReturnValue({
          isValid: true,
          errors: [],
          data: validInvoiceData,
        } as InvoiceValidation);

        const result = await service.extractInvoiceFromPdf(buffer);

        expect(result).toEqual(validInvoiceData);
        expect(cacheService.setCachedResult).toHaveBeenCalled();
      });
    });

    it('should throw error when validation fails', async () => {
      const buffer = Buffer.from('test pdf content');
      const invalidData = { ...validInvoiceData, clientNumber: undefined };

      cacheService.getCachedResult.mockResolvedValue(null);
      layoutService.getLayouts.mockReturnValue([mockLayout]);
      mockLayout.extract.mockResolvedValue(invalidData);
      validationService.validateExtractedData.mockReturnValue({
        isValid: false,
        errors: ['Número do cliente inválido'],
        data: undefined,
      } as InvoiceValidation);

      await expect(service.extractInvoiceFromPdf(buffer)).rejects.toThrow(
        PdfExtractionError,
      );
    });

    it('should try all layouts before failing', async () => {
      const buffer = Buffer.from('test pdf content');
      const mockLayout2 = { ...mockLayout, name: 'Layout 2' };

      cacheService.getCachedResult.mockResolvedValue(null);
      layoutService.getLayouts.mockReturnValue([mockLayout, mockLayout2]);
      mockLayout.extract.mockRejectedValue(new Error('Layout 1 failed'));
      mockLayout2.extract.mockRejectedValue(new Error('Layout 2 failed'));

      await expect(service.extractInvoiceFromPdf(buffer)).rejects.toThrow(
        PdfExtractionError,
      );

      expect(mockLayout.extract).toHaveBeenCalled();
      expect(mockLayout2.extract).toHaveBeenCalled();
    });

    it('should handle PDF parsing errors', async () => {
      const buffer = Buffer.from('invalid pdf content');

      cacheService.getCachedResult.mockResolvedValue(null);

      await expect(service.extractInvoiceFromPdf(buffer)).rejects.toThrow(
        PdfExtractionError,
      );
    });
  });
});
