import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { Invoice } from '@/modules/invoice/entities/invoice.entity';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Lumi API')
    .setDescription('API para processamento de faturas de energia elétrica')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação e autorização')
    .addTag('invoices', 'Gerenciamento de faturas')
    .addTag('dashboard', 'Visualização de dados')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT para autenticação',
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
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });
}
