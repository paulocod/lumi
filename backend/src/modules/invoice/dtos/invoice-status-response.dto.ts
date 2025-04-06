import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';

export class InvoiceStatusResponseDto {
  @ApiProperty({
    description: 'Status atual da fatura',
    enum: InvoiceStatus,
    example: InvoiceStatus.COMPLETED,
  })
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Mensagem de erro, se houver',
    example: 'Erro ao processar PDF',
    required: false,
  })
  error?: string;
}
