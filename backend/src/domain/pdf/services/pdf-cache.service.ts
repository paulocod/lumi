import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { LoggerService } from '../../../config/logger.service';
import { CachedExtraction } from '../types/pdf-extraction.types';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';
import { InvoiceStatus } from '../../invoice/entities/invoice.entity';

interface SerializedCachedExtraction {
  hash: string;
  result: {
    clientNumber: string;
    referenceMonth: string;
    electricityQuantity: number;
    electricityValue: number;
    sceeQuantity: number;
    sceeValue: number;
    compensatedEnergyQuantity: number;
    compensatedEnergyValue: number;
    publicLightingValue: number;
    pdfUrl?: string;
    status?: InvoiceStatus;
  };
  confidence: Array<{
    field: string;
    value: string | number;
    confidence: number;
    method: string;
  }>;
  timestamp: string;
}

@Injectable()
export class PdfCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  async getCachedResult(buffer: Buffer): Promise<CachedExtraction | null> {
    try {
      const hash = this.generateHash(buffer);
      const key = `pdf:${hash}`;
      const cachedJson = await this.cacheManager.get<string>(key);

      if (cachedJson) {
        this.logger.debug(
          `Cache hit para extração de PDF com chave ${key}`,
          'PdfCacheService',
        );
        const cached = JSON.parse(cachedJson) as SerializedCachedExtraction;
        return {
          hash: cached.hash,
          result: {
            ...cached.result,
            referenceMonth: new Date(cached.result.referenceMonth),
            status: cached.result.status as InvoiceStatus,
          },
          confidence: cached.confidence,
          timestamp: new Date(cached.timestamp),
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar resultado em cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'PdfCacheService',
      );
      return null;
    }
  }

  async setCachedResult(
    buffer: Buffer,
    result: CreateInvoiceDto,
    confidence: CachedExtraction['confidence'],
  ): Promise<void> {
    try {
      const hash = this.generateHash(buffer);
      const key = `pdf:${hash}`;
      const serialized: SerializedCachedExtraction = {
        hash,
        result: {
          ...result,
          referenceMonth: result.referenceMonth.toISOString(),
        },
        confidence,
        timestamp: new Date().toISOString(),
      };

      const serializedJson = JSON.stringify(serialized);
      await this.cacheManager.set(key, serializedJson, 60 * 60 * 24); // 24 horas
    } catch (error) {
      this.logger.error(
        `Erro ao salvar resultado em cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'PdfCacheService',
      );
    }
  }

  private generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
