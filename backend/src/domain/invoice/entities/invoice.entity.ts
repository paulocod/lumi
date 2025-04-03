import { ApiProperty } from '@nestjs/swagger';

export class Invoice {
  @ApiProperty({
    description: 'ID da fatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

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
  publicLightingContribution: number;

  @ApiProperty({
    description: 'Data de criação da fatura',
    example: '2024-03-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização da fatura',
    example: '2024-03-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }

  get totalConsumption(): number {
    return this.electricityQuantity + this.sceeQuantity;
  }

  get totalValueWithoutGD(): number {
    return (
      this.electricityValue + this.sceeValue + this.publicLightingContribution
    );
  }

  get economyGD(): number {
    return this.compensatedEnergyValue;
  }
}
