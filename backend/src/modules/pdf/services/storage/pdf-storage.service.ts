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
  private readonly defaultBucketName: string;

  constructor(
    @Inject(MINIO_CLIENT)
    private readonly minioClient: IMinioClient,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.defaultBucketName =
      this.configService.get<string>('MINIO_BUCKET_NAME') || 'pdfs';

    // Inicialização do bucket padrão
    void this.initializeBucket(this.defaultBucketName);
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
    bucketName?: string,
  ): Promise<string> {
    const targetBucket = bucketName || this.defaultBucketName;
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

  async downloadPdf(objectName: string, bucketName?: string): Promise<Buffer> {
    const targetBucket = bucketName || this.defaultBucketName;
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
      // Download do PDF do bucket de origem
      const pdfBuffer = await this.downloadPdf(sourceObjectName, sourceBucket);

      // Upload para o bucket de destino
      const finalObjectName = newObjectName || sourceObjectName;
      await this.uploadPdf(pdfBuffer, finalObjectName, destinationBucket);

      // Deletar do bucket de origem
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
    bucketName?: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    const targetBucket = bucketName || this.defaultBucketName;
    try {
      const expiry = expiresInSeconds || 3600; // 1 hora por padrão

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
}
