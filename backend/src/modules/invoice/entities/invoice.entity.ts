import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class Invoice {
  @ApiProperty({
    description: 'ID da fatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id?: string;

  @ApiProperty({
    description: 'Número do cliente',
    example: '7005400387',
  })
  clientNumber: string;

  @ApiProperty({
    description: 'Mês de referência da fatura',
    example: '2024-03-01T00:00:00.000Z',
  })
  referenceMonth: Date;

  @ApiProperty({
    description: 'Quantidade de energia elétrica (kWh)',
    example: 50,
  })
  electricityQuantity: number;

  @ApiProperty({
    description: 'Valor da energia elétrica (R$)',
    example: 43.28,
  })
  electricityValue: number;

  @ApiProperty({
    description: 'Quantidade de energia SCEE (kWh)',
    example: 1007,
  })
  sceeQuantity: number;

  @ApiProperty({
    description: 'Valor da energia SCEE (R$)',
    example: 502.35,
  })
  sceeValue: number;

  @ApiProperty({
    description: 'Quantidade de energia compensada (kWh)',
    example: 1007,
  })
  compensatedEnergyQuantity: number;

  @ApiProperty({
    description: 'Valor da energia compensada (R$)',
    example: -502.35,
  })
  compensatedEnergyValue: number;

  @ApiProperty({
    description: 'Contribuição de iluminação pública (R$)',
    example: 49.43,
  })
  publicLightingValue: number;

  @ApiProperty({
    description: 'URL do PDF da fatura',
    example: 'https://example.com/invoice.pdf',
    required: false,
  })
  pdfUrl?: string;

  @ApiProperty({
    description: 'Status do processamento da fatura',
    example: InvoiceStatus.COMPLETED,
    enum: InvoiceStatus,
  })
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Mensagem de erro em caso de falha no processamento',
    example: 'Erro ao processar PDF',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Data de criação da fatura',
    example: '2024-03-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Data da última atualização da fatura',
    example: '2024-03-01T00:00:00.000Z',
  })
  updatedAt?: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }

  get totalConsumption(): number {
    return (
      this.electricityQuantity +
      this.sceeQuantity +
      this.compensatedEnergyQuantity
    );
  }

  get totalValueWithoutGD(): number {
    return this.electricityValue + this.sceeValue + this.publicLightingValue;
  }

  get economyGD(): number {
    return Math.abs(this.compensatedEnergyValue);
  }
}
