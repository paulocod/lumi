import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PdfCacheService } from './pdf-cache.service';
import { LoggerService } from '../../../config/logger.service';
import { CachedExtraction } from '../types/pdf-extraction.types';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';

describe('PdfCacheService', () => {
  let service: PdfCacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PdfCacheService>(PdfCacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCachedResult', () => {
    it('should return cached result when available', async () => {
      const buffer = Buffer.from('test pdf content');
      const cachedData: CachedExtraction = {
        hash: 'test-hash',
        result: {
          clientNumber: '7204076116',
          referenceMonth: new Date('2024-01-01'),
          electricityQuantity: 50,
          electricityValue: 47.75,
          sceeQuantity: 456,
          sceeValue: 235.42,
          compensatedEnergyQuantity: 456,
          compensatedEnergyValue: -225.42,
          publicLightingContribution: 49.43,
        },
        confidence: [
          {
            field: 'clientNumber',
            value: '7204076116',
            confidence: 1,
            method: 'regex',
          },
        ],
        timestamp: new Date(),
      };

      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getCachedResult(buffer);

      expect(result).toEqual(cachedData);
      expect(cacheManager.get).toHaveBeenCalled();
    });

    it('should return null when cache is empty', async () => {
      const buffer = Buffer.from('test pdf content');
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getCachedResult(buffer);

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      const buffer = Buffer.from('test pdf content');
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.getCachedResult(buffer);

      expect(result).toBeNull();
    });
  });

  describe('setCachedResult', () => {
    it('should cache extraction result', async () => {
      const buffer = Buffer.from('test pdf content');
      const result: CreateInvoiceDto = {
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
      const confidence = [
        {
          field: 'clientNumber',
          value: '7204076116',
          confidence: 1,
          method: 'regex',
        },
      ];

      await service.setCachedResult(buffer, result, confidence);

      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      const buffer = Buffer.from('test pdf content');
      const result: CreateInvoiceDto = {
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
      const confidence = [
        {
          field: 'clientNumber',
          value: '7204076116',
          confidence: 1,
          method: 'regex',
        },
      ];

      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      await service.setCachedResult(buffer, result, confidence);
    });
  });
});
