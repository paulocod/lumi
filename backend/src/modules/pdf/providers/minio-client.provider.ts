/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientOptions } from 'minio';
import { MINIO_CLIENT } from '../constants/minio.constants';

export const MinioClientProvider: Provider<Client> = {
  provide: MINIO_CLIENT,
  useFactory: (configService: ConfigService) => {
    const minioConfig: ClientOptions = {
      endPoint: configService.get<string>('MINIO_ENDPOINT') || 'minio',
      port: configService.get<number>('MINIO_PORT') || 9000,
      useSSL:
        configService.get<string>('MINIO_USE_SSL')?.toLowerCase() === 'true',
      accessKey: configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY'),
    };

    return new Client(minioConfig);
  },
  inject: [ConfigService],
};
