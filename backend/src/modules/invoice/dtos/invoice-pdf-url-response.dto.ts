import { ApiProperty } from '@nestjs/swagger';

export class InvoicePdfUrlResponseDto {
  @ApiProperty({
    description: 'URL assinada para download do PDF',
    example: 'https://storage.example.com/invoices/123.pdf?signature=abc',
  })
  url: string;
}
