import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '@/config/logger';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { CachedExtraction } from '../../types/pdf-types';

interface SerializedCachedExtraction {
  hash: string;
  result: Record<string, any>;
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
  private readonly ttl: number;
  private readonly prefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.ttl = this.configService.get<number>('pdf.cache.ttl') || 3600;
    this.prefix = this.configService.get<string>('cache.prefix') || 'cache:';
  }

  async getCachedExtraction(buffer: Buffer): Promise<CachedExtraction | null> {
    try {
      const hash = this.generateHash(buffer);
      const key = `${this.prefix}pdf:${hash}`;

      const cached =
        await this.cacheManager.get<SerializedCachedExtraction>(key);

      if (!cached) {
        this.logger.debug(`Cache miss para PDF: ${hash.substring(0, 8)}...`);
        return null;
      }

      this.logger.debug(`Cache hit para PDF: ${hash.substring(0, 8)}...`);

      return {
        hash: cached.hash,
        result: cached.result,
        confidence: cached.confidence,
        timestamp: new Date(cached.timestamp),
      };
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao buscar cache',
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  async setCachedResult(
    buffer: Buffer,
    extraction: CachedExtraction,
  ): Promise<void> {
    try {
      const hash = this.generateHash(buffer);
      const key = `${this.prefix}pdf:${hash}`;

      const serialized: SerializedCachedExtraction = {
        hash: extraction.hash,
        result: extraction.result,
        confidence: extraction.confidence,
        timestamp:
          extraction.timestamp instanceof Date
            ? extraction.timestamp.toISOString()
            : extraction.timestamp,
      };

      await this.cacheManager.set(key, serialized, this.ttl);
      this.logger.debug(
        `Cache atualizado para PDF: ${hash.substring(0, 8)}...`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao salvar no cache',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
