import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientOptions } from 'minio';
import { MINIO_CLIENT } from '../constants/minio.constants';

export const MinioClientProvider: Provider<Client> = {
  provide: MINIO_CLIENT,
  useFactory: (configService: ConfigService) => {
    const useSSLValue = configService.get<string>('minio.useSSL');
    const minioConfig: ClientOptions = {
      endPoint: configService.get<string>('minio.endpoint') || 'localhost',
      port: configService.get<number>('minio.port') || 9000,
      useSSL: useSSLValue ? useSSLValue.toLowerCase() === 'true' : false,
      accessKey: configService.get<string>('minio.accessKey'),
      secretKey: configService.get<string>('minio.secretKey'),
    };

    return new Client(minioConfig);
  },
  inject: [ConfigService],
};
