/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CacheError } from '@/shared/errors/application.errors';
import { LoggerService } from '@/config/logger';
import { CachedExtraction } from '../../types/pdf-extraction.types';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';

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
  private readonly memoryCache: Map<string, CachedExtraction> = new Map();
  private readonly ttl: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.ttl = this.configService.get<number>('pdf.cache.ttl') || 3600;
  }

  async getCachedExtraction(buffer: Buffer): Promise<CachedExtraction | null> {
    const hash = this.generateHash(buffer);

    try {
      const memoryResult = this.memoryCache.get(hash);
      if (memoryResult) {
        this.logger.debug(`Cache hit em memória - hash: ${hash}`);
        return memoryResult;
      }

      const redisResult =
        await this.cacheManager.get<SerializedCachedExtraction>(`pdf:${hash}`);

      if (redisResult) {
        this.logger.debug(`Cache hit no Redis - hash: ${hash}`);
        const cachedExtraction = this.deserialize(redisResult);
        this.memoryCache.set(hash, cachedExtraction);
        return cachedExtraction;
      }

      this.logger.debug(`Cache miss - hash: ${hash}`);
      return null;
    } catch (error) {
      this.logger.error(`Erro ao obter cache - hash: ${hash}`, error);
      throw new CacheError('Erro ao obter cache');
    }
  }

  async setCachedExtraction(
    buffer: Buffer,
    extraction: CachedExtraction,
  ): Promise<void> {
    const hash = this.generateHash(buffer);

    try {
      await this.cacheManager.set(
        `pdf:${hash}`,
        this.serialize(extraction),
        this.ttl * 1000,
      );

      this.memoryCache.set(hash, extraction);

      this.logger.debug(`Cache atualizado - hash: ${hash}`);
    } catch (error) {
      this.logger.error(`Erro ao salvar cache - hash: ${hash}`, error);
      throw new CacheError('Erro ao salvar cache');
    }
  }

  async invalidateCache(buffer: Buffer): Promise<void> {
    const hash = this.generateHash(buffer);

    try {
      await this.cacheManager.del(`pdf:${hash}`);
      this.memoryCache.delete(hash);

      this.logger.debug(`Cache invalidado - hash: ${hash}`);
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache - hash: ${hash}`, error);
      throw new CacheError('Erro ao invalidar cache');
    }
  }

  private generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  generatePdfHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private serialize(extraction: CachedExtraction): SerializedCachedExtraction {
    return {
      hash: extraction.hash,
      result: {
        clientNumber: extraction.result.clientNumber,
        referenceMonth: extraction.result.referenceMonth.toISOString(),
        electricityQuantity: extraction.result.electricityQuantity,
        electricityValue: extraction.result.electricityValue,
        sceeQuantity: extraction.result.sceeQuantity,
        sceeValue: extraction.result.sceeValue,
        compensatedEnergyQuantity: extraction.result.compensatedEnergyQuantity,
        compensatedEnergyValue: extraction.result.compensatedEnergyValue,
        publicLightingValue: extraction.result.publicLightingValue,
        pdfUrl: extraction.result.pdfUrl,
        status: extraction.result.status as InvoiceStatus,
      },
      confidence: extraction.confidence,
      timestamp: extraction.timestamp.toISOString(),
    };
  }

  private deserialize(data: SerializedCachedExtraction): CachedExtraction {
    return {
      hash: data.hash,
      result: {
        ...data.result,
        referenceMonth: new Date(data.result.referenceMonth),
      },
      confidence: data.confidence,
      timestamp: new Date(data.timestamp),
    };
  }
}
