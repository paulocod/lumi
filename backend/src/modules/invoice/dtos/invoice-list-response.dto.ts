import { ApiProperty } from '@nestjs/swagger';
import { Invoice } from '../entities/invoice.entity';

export class InvoiceListResponseDto {
  @ApiProperty({
    description: 'Lista de faturas',
    type: [Invoice],
  })
  invoices: Invoice[];

  @ApiProperty({
    description: 'Total de faturas',
    example: 10,
  })
  total: number;
}
