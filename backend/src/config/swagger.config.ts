import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { Invoice } from '../domain/invoice/entities/invoice.entity';
import { UploadInvoiceUrlDto } from '../domain/invoice/dto/upload-invoice.dto';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API de Faturas')
    .setDescription('API para processamento de faturas de energia')
    .setVersion('1.0')
    .addTag('invoices')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [Invoice, UploadInvoiceUrlDto],
  });

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
