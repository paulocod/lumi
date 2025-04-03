import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UploadInvoiceBufferDto {
  @ApiProperty({
    description: 'Buffer do PDF da fatura',
    type: 'string',
    format: 'binary',
  })
  @IsNotEmpty()
  file: Buffer;
}

export class UploadInvoiceUrlDto {
  @ApiProperty({
    description: 'URL do PDF da fatura',
    example: 'https://exemplo.com/fatura.pdf',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;
}
