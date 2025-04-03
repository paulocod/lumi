import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { LoggerService } from '../../../config/logger.service';
import { CachedExtraction } from '../types/pdf-extraction.types';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';

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
      const cached = await this.cacheManager.get<CachedExtraction>(key);

      if (cached) {
        this.logger.debug(
          `Cache hit para extração de PDF com chave ${key}`,
          'PdfCacheService',
        );
      }

      return cached;
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
      const cached: CachedExtraction = {
        hash,
        result,
        confidence,
        timestamp: new Date(),
      };

      await this.cacheManager.set(key, cached, 60 * 60 * 24); // 24 horas
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
