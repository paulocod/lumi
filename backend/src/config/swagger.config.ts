import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { Invoice } from '@/modules/invoice/entities/invoice.entity';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API de Faturas')
    .setDescription('API para processamento de faturas de energia')
    .setVersion('1.0')
    .addTag('invoices')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [Invoice],
  });

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  });
}
