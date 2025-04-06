/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { LoggerService } from '@/config/logger';
import {
  PdfExtractionError,
  PdfExtractionResult,
  ExtractionConfidence,
  CachedExtraction,
} from '../types/pdf-types';
import * as pdf from 'pdf-parse';
import { PdfCacheService } from './cache/pdf-cache.service';
import { PdfStorageService } from './storage/pdf-storage.service';
import { PdfLayoutService } from './layout/pdf-layout.service';

interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

@Injectable()
export class PdfService {
  constructor(
    @Inject(forwardRef(() => PdfLayoutService))
    private readonly layoutService: PdfLayoutService,
    private readonly pdfStorageService: PdfStorageService,
    private readonly cacheService: PdfCacheService,
    private readonly logger: LoggerService,
  ) {}

  async extractData<T>(
    buffer: Buffer,
    layoutName: string,
    options: {
      useCache?: boolean;
      validateResult?: boolean;
    } = {},
  ): Promise<PdfExtractionResult<T>> {
    this.logger.debug('=== Início da Extração do PDF ===');
    const startTime = Date.now();

    try {
      if (!Buffer.isBuffer(buffer)) {
        this.logger.error('Buffer inválido fornecido');
        throw new PdfExtractionError([
          {
            code: 'INVALID_BUFFER',
            message: 'O buffer fornecido não é válido',
          },
        ]);
      }

      const layout = this.layoutService.getLayout(layoutName);
      if (!layout) {
        this.logger.error(`Layout ${layoutName} não encontrado`);
        throw new PdfExtractionError([
          {
            code: 'LAYOUT_NOT_FOUND',
            message: `Layout ${layoutName} não encontrado`,
          },
        ]);
      }

      if (options.useCache) {
        const cached = await this.cacheService.getCachedExtraction(buffer);
        if (cached) {
          this.logger.debug('Usando cache para extração');
          return {
            data: cached.result as T,
            confidence: cached.confidence,
            metadata: {
              numPages: 0,
              layout: layout.name,
              processingTime: 0,
            },
          };
        }
      }

      const pdfData = await this.extractPdfText(buffer);
      if (!pdfData) {
        this.logger.error('Falha ao extrair texto do PDF');
        throw new PdfExtractionError([
          {
            code: 'PDF_PARSE_ERROR',
            message: 'Falha ao extrair texto do PDF',
          },
        ]);
      }

      this.logger.debug(`Texto extraído do PDF: ${pdfData.text}`);
      this.logger.debug('Iniciando extração de dados com layout...');
      const extractedData = await layout.extract(pdfData.text);
      this.logger.debug(
        `Dados extraídos: ${JSON.stringify(extractedData, null, 2)}`,
      );

      if (options.validateResult) {
        this.logger.debug('Validando dados extraídos...');
        if (!layout.validate(extractedData)) {
          this.logger.error('Dados extraídos não passaram na validação');
          this.logger.debug(
            `Dados inválidos: ${JSON.stringify(extractedData, null, 2)}`,
          );
          throw new PdfExtractionError([
            {
              code: 'INVALID_DATA',
              message: 'Dados extraídos não passaram na validação',
            },
          ]);
        }
        this.logger.debug('Validação concluída com sucesso');
      }

      const result: PdfExtractionResult<T> = {
        data: extractedData as T,
        confidence: this.calculateConfidence(extractedData),
        metadata: {
          numPages: pdfData.numpages,
          layout: layout.name,
          processingTime: Date.now() - startTime,
        },
      };

      if (options.useCache) {
        await this.saveToCache(buffer, extractedData, result.confidence);
      }

      return result;
    } catch (error: unknown) {
      this.logger.error(
        'Erro na extração',
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof PdfExtractionError) {
        throw error;
      }
      throw new PdfExtractionError([
        {
          code: 'UNKNOWN_ERROR',
          message: 'Erro desconhecido durante a extração',
        },
      ]);
    }
  }

  async processPdf(
    buffer: Buffer,
    filename: string,
    layoutName: string,
    options: {
      useCache?: boolean;
      validateResult?: boolean;
    } = {},
  ): Promise<{
    storageKey: string;
    extractionResult: PdfExtractionResult<unknown>;
  }> {
    try {
      const storageKey = await this.pdfStorageService.uploadPdf(
        buffer,
        filename,
      );

      const extractionResult = await this.extractData(
        buffer,
        layoutName,
        options,
      );

      return {
        storageKey,
        extractionResult,
      };
    } catch (error) {
      this.logger.error(
        'Erro ao processar PDF',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async extractPdfText(buffer: Buffer): Promise<PdfParseResult | null> {
    try {
      const result = (await pdf(buffer)) as PdfParseResult;
      this.logger.debug(`Número de páginas: ${result.numpages}`);
      this.logger.debug(`Versão do PDF: ${result.version}`);
      return result;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao extrair texto do PDF',
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  private async saveToCache(
    buffer: Buffer,
    extractedData: unknown,
    confidence: ExtractionConfidence[],
  ): Promise<void> {
    try {
      const hash = this.cacheService.generateHash(buffer);
      const cacheData: CachedExtraction = {
        hash,
        result: extractedData as Record<string, any>,
        confidence,
        timestamp: new Date(),
      };

      await this.cacheService.setCachedResult(buffer, cacheData);
    } catch (error) {
      this.logger.error(
        'Erro ao salvar cache',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private calculateConfidence(data: unknown): ExtractionConfidence[] {
    if (typeof data !== 'object' || data === null) {
      return [];
    }

    return Object.entries(data).map(([field, value]) => ({
      field,
      value: String(value),
      confidence: 1.0,
      method: 'regex',
    }));
  }

  async getSignedUrl(
    storageKey: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    try {
      this.logger.debug(
        `Gerando URL assinada para o PDF com chave: ${storageKey}`,
      );
      return await this.pdfStorageService.getPdfUrl(
        storageKey,
        expiresInSeconds?.toString(),
      );
    } catch (error) {
      this.logger.error('Erro ao gerar URL assinada', String(error));
      throw new PdfExtractionError([
        {
          code: 'URL_GENERATION_ERROR',
          message: 'Falha ao gerar URL assinada para download do PDF',
        },
      ]);
    }
  }

  /**
   * Obtém um PDF do armazenamento
   * @param storageKey Chave de armazenamento do PDF
   * @returns Buffer contendo o PDF
   */
  async getPdfFromStorage(storageKey: string): Promise<Buffer> {
    try {
      this.logger.debug(
        `Obtendo PDF do armazenamento com chave: ${storageKey}`,
      );
      return await this.pdfStorageService.downloadPdf(storageKey);
    } catch (error) {
      this.logger.error('Erro ao obter PDF do armazenamento', String(error));
      throw new PdfExtractionError([
        {
          code: 'PDF_DOWNLOAD_ERROR',
          message: 'Falha ao obter PDF do armazenamento',
        },
      ]);
    }
  }
}
