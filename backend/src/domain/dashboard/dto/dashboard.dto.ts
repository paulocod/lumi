import { ApiProperty } from '@nestjs/swagger';

export class EnergyDataDto {
  @ApiProperty({
    description: 'Consumo de Energia Elétrica (kWh)',
    example: 526,
  })
  electricityConsumption: number;

  @ApiProperty({
    description: 'Energia Compensada (kWh)',
    example: 476,
  })
  compensatedEnergy: number;

  @ApiProperty({
    description: 'Mês de referência',
    example: '2024-03-01T00:00:00.000Z',
  })
  month: Date;
}

export class FinancialDataDto {
  @ApiProperty({
    description: 'Valor Total sem GD (R$)',
    example: 502.35,
  })
  totalWithoutGD: number;

  @ApiProperty({
    description: 'Economia GD (R$)',
    example: 225.42,
  })
  gdSavings: number;

  @ApiProperty({
    description: 'Mês de referência',
    example: '2024-03-01T00:00:00.000Z',
  })
  month: Date;
}
