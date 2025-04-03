import { Test, TestingModule } from '@nestjs/testing';
import { PdfLayoutService } from './pdf-layout.service';
import { LoggerService } from '../../../config/logger.service';

describe('PdfLayoutService', () => {
  let service: PdfLayoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfLayoutService,
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

    service = module.get<PdfLayoutService>(PdfLayoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLayouts', () => {
    it('should return available layouts', () => {
      const layouts = service.getLayouts();
      expect(layouts).toHaveLength(1);
      expect(layouts[0].name).toBe('CEMIG');
    });
  });

  describe('CEMIG layout', () => {
    const layout = service.getLayouts()[0];

    it('should extract client number', async () => {
      const text = 'Nº DO CLIENTE 7204076116';
      const result = await layout.extract(text);
      expect(result.clientNumber).toBe('7204076116');
    });

    it('should extract reference month', async () => {
      const text = 'Referente a JAN/2024';
      const result = await layout.extract(text);
      expect(result.referenceMonth).toEqual(new Date(2024, 0, 1));
    });

    it('should extract electricity data', async () => {
      const text = 'Energia Elétrica 50 kWh 47,75';
      const result = await layout.extract(text);
      expect(result.electricityQuantity).toBe(50);
      expect(result.electricityValue).toBe(47.75);
    });

    it('should extract SCEE data', async () => {
      const text = 'Energia SCEE s/ICMS 456 kWh 235,42';
      const result = await layout.extract(text);
      expect(result.sceeQuantity).toBe(456);
      expect(result.sceeValue).toBe(235.42);
    });

    it('should extract compensated energy data', async () => {
      const text = 'Energia compensada GD I 456 kWh -225,42';
      const result = await layout.extract(text);
      expect(result.compensatedEnergyQuantity).toBe(456);
      expect(result.compensatedEnergyValue).toBe(-225.42);
    });

    it('should extract public lighting contribution', async () => {
      const text = 'Contrib Ilum Publica Municipal 49,43';
      const result = await layout.extract(text);
      expect(result.publicLightingValue).toBe(49.43);
    });

    it('should handle alternative formats', async () => {
      const text = `
        Cliente: 7204076116
        Fatura de Janeiro de 2024
        Energia Própria 50 47,75
        Geração Própria 456 235,42
        Créd. Energia 456 -225,42
        CIP/COSIP 49,43
      `;
      const result = await layout.extract(text);

      expect(result.clientNumber).toBe('7204076116');
      expect(result.referenceMonth).toEqual(new Date(2024, 0, 1));
      expect(result.electricityQuantity).toBe(50);
      expect(result.electricityValue).toBe(47.75);
      expect(result.sceeQuantity).toBe(456);
      expect(result.sceeValue).toBe(235.42);
      expect(result.compensatedEnergyQuantity).toBe(456);
      expect(result.compensatedEnergyValue).toBe(-225.42);
      expect(result.publicLightingValue).toBe(49.43);
    });
  });
});
