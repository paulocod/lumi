import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'PDF enviado para processamento com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'ID do job de processamento',
    example: 'new-1234567890',
  })
  jobId: string;
}
