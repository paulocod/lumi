import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/config/logger';
import {
  BucketOperationError,
  ObjectOperationError,
} from '../../errors/storage.errors';
import { IMinioClient } from '../../interfaces/minio-client.interface';
import { MINIO_CLIENT } from '../../constants/minio.constants';

@Injectable()
export class PdfStorageService {
  private readonly processBucketName: string;
  private readonly processedBucketName: string;

  constructor(
    @Inject(MINIO_CLIENT)
    private readonly minioClient: IMinioClient,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.processBucketName =
      this.configService.get<string>('minio.processBucket') ||
      'lumi-process-invoices';
    this.processedBucketName =
      this.configService.get<string>('minio.processedBucket') ||
      'lumi-processed-invoices';

    void this.initializeBuckets();
  }

  private async initializeBuckets(): Promise<void> {
    try {
      await this.initializeBucket(this.processBucketName);
      await this.initializeBucket(this.processedBucketName);
      await this.setBucketPolicy(this.processedBucketName);
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao inicializar buckets',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async setBucketPolicy(bucketName: string): Promise<void> {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        bucketName,
        JSON.stringify(policy),
      );
      this.logger.debug(
        `Política do bucket ${bucketName} configurada com sucesso`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao configurar política do bucket ${bucketName}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new BucketOperationError(bucketName, 'set-policy', error);
    }
  }

  private async initializeBucket(bucketName: string): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName);
        this.logger.debug(`Bucket ${bucketName} criado com sucesso`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao inicializar bucket ${bucketName}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new BucketOperationError(bucketName, 'initialize', error);
    }
  }

  async uploadPdf(
    buffer: Buffer,
    filename: string,
    bucketName: string,
  ): Promise<string> {
    const targetBucket = bucketName;
    try {
      await this.initializeBucket(targetBucket);

      const objectName = `${Date.now()}-${filename}`;
      await this.minioClient.putObject(
        targetBucket,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': 'application/pdf',
        },
      );

      this.logger.debug(
        `PDF ${filename} enviado com sucesso para o bucket ${targetBucket}`,
      );
      return objectName;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao enviar PDF',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(filename, targetBucket, 'upload', error);
    }
  }

  async downloadPdf(objectName: string, bucketName: string): Promise<Buffer> {
    const targetBucket = bucketName;
    try {
      const dataStream = await this.minioClient.getObject(
        targetBucket,
        objectName,
      );

      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        dataStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', (err: Error) => {
          reject(
            new ObjectOperationError(objectName, targetBucket, 'download', err),
          );
        });
      });
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao baixar PDF',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        targetBucket,
        'download',
        error,
      );
    }
  }

  async movePdfBetweenBuckets(
    sourceObjectName: string,
    sourceBucket: string,
    destinationBucket: string,
    newObjectName?: string,
  ): Promise<string> {
    try {
      const pdfBuffer = await this.downloadPdf(sourceObjectName, sourceBucket);

      const finalObjectName = newObjectName || sourceObjectName;
      await this.uploadPdf(pdfBuffer, finalObjectName, destinationBucket);

      await this.minioClient.removeObject(sourceBucket, sourceObjectName);

      this.logger.debug(
        `PDF movido com sucesso de ${sourceBucket}/${sourceObjectName} para ${destinationBucket}/${finalObjectName}`,
      );

      return finalObjectName;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao mover PDF entre buckets',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        sourceObjectName,
        sourceBucket,
        'move',
        error,
      );
    }
  }

  async getPdfUrl(
    objectName: string,
    bucketName: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    let targetBucket = bucketName;

    if (objectName.startsWith('processed/')) {
      targetBucket = this.processedBucketName;
      objectName = objectName.replace('processed/', '');
    } else if (objectName.startsWith('process/')) {
      targetBucket = this.processBucketName;
      objectName = objectName.replace('process/', '');
    }

    try {
      const expiry = expiresInSeconds || 3600;

      const url = await this.minioClient.presignedGetObject(
        targetBucket,
        objectName,
        expiry,
      );

      return url;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao gerar URL do PDF',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(objectName, targetBucket, 'getUrl', error);
    }
  }

  async uploadPdfForProcessing(
    buffer: Buffer,
    filename: string,
  ): Promise<string> {
    try {
      const objectName = `${Date.now()}-${filename}`;
      await this.minioClient.putObject(
        this.processBucketName,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': 'application/pdf',
        },
      );

      this.logger.debug(
        `PDF ${filename} enviado com sucesso para processamento no bucket ${this.processBucketName}`,
      );
      return objectName;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao enviar PDF para processamento',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        filename,
        this.processBucketName,
        'upload',
        error,
      );
    }
  }

  async moveToProcessed(
    objectName: string,
    processedBuffer: Buffer,
  ): Promise<string> {
    try {
      await this.minioClient.putObject(
        this.processedBucketName,
        objectName,
        processedBuffer,
        processedBuffer.length,
        {
          'Content-Type': 'application/pdf',
        },
      );

      await this.minioClient.removeObject(this.processBucketName, objectName);

      this.logger.debug(
        `PDF ${objectName} movido com sucesso para o bucket ${this.processedBucketName}`,
      );

      return objectName;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao mover PDF processado',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        this.processedBucketName,
        'move',
        error,
      );
    }
  }

  async getPdfFromProcessBucket(objectName: string): Promise<Buffer> {
    try {
      const dataStream = await this.minioClient.getObject(
        this.processBucketName,
        objectName,
      );

      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        dataStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', (err: Error) => {
          reject(
            new ObjectOperationError(
              objectName,
              this.processBucketName,
              'download',
              err,
            ),
          );
        });
      });
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao baixar PDF do bucket de processamento',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        this.processBucketName,
        'download',
        error,
      );
    }
  }

  async getProcessedPdfUrl(
    objectName: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    try {
      const expiry = expiresInSeconds || 3600;

      try {
        await this.minioClient.statObject(this.processedBucketName, objectName);
      } catch (error) {
        this.logger.error(
          `Objeto ${objectName} não encontrado no bucket ${this.processedBucketName}`,
          error instanceof Error ? error.message : String(error),
        );
        throw new ObjectOperationError(
          objectName,
          this.processedBucketName,
          'stat',
          error,
        );
      }

      const url = await this.minioClient.presignedGetObject(
        this.processedBucketName,
        objectName,
        expiry,
      );

      return url;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao gerar URL do PDF processado',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        this.processedBucketName,
        'getUrl',
        error,
      );
    }
  }

  async deleteFromProcessBucket(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.processBucketName, objectName);
      this.logger.debug(
        `PDF ${objectName} removido com sucesso do bucket de processamento`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao remover PDF do bucket de processamento',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        this.processBucketName,
        'delete',
        error,
      );
    }
  }

  async getDirectPdfUrl(objectName: string): Promise<string> {
    try {
      const port = this.configService.get<number>('minio.port');
      const useSSL = this.configService.get<boolean>('minio.useSSL');
      const protocol = useSSL ? 'https' : 'http';

      await this.minioClient.statObject(this.processedBucketName, objectName);

      // Usa localhost para acessar o Minio externamente
      const publicEndpoint = 'localhost';
      return `${protocol}://${publicEndpoint}:${port}/${this.processedBucketName}/${objectName}`;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao gerar URL direta do PDF',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        this.processedBucketName,
        'getDirectUrl',
        error,
      );
    }
  }

  async listUnprocessedPdfs(): Promise<
    Array<{ objectName: string; uploadDate: Date }>
  > {
    try {
      const objects = this.minioClient.listObjects(this.processBucketName);
      const unprocessedPdfs: Array<{ objectName: string; uploadDate: Date }> =
        [];

      for await (const obj of objects) {
        if (obj.name.endsWith('.pdf')) {
          unprocessedPdfs.push({
            objectName: obj.name,
            uploadDate: obj.lastModified,
          });
        }
      }

      this.logger.debug(
        `Listados ${unprocessedPdfs.length} PDFs não processados do bucket ${this.processBucketName}`,
      );

      return unprocessedPdfs;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao listar PDFs não processados',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        'list',
        this.processBucketName,
        'list',
        error,
      );
    }
  }

  async updatePdfInProcessBucket(
    objectName: string,
    buffer: Buffer,
  ): Promise<void> {
    try {
      await this.minioClient.putObject(
        this.processBucketName,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': 'application/pdf',
        },
      );

      this.logger.debug(
        `PDF ${objectName} atualizado com sucesso no bucket ${this.processBucketName}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao atualizar PDF no bucket de processamento',
        error instanceof Error ? error.message : String(error),
      );
      throw new ObjectOperationError(
        objectName,
        this.processBucketName,
        'update',
        error,
      );
    }
  }
}
