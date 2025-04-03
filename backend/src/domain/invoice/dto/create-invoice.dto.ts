import { IsString, IsDate, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Número do cliente',
    example: '7005400387',
  })
  @IsString()
  @IsNotEmpty()
  clientNumber: string;

  @ApiProperty({
    description: 'Mês de referência da fatura',
    example: '2024-03-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  referenceMonth: Date;

  @ApiProperty({
    description: 'Quantidade de energia elétrica (kWh)',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  electricityQuantity: number;

  @ApiProperty({
    description: 'Valor da energia elétrica (R$)',
    example: 43.28,
  })
  @IsNumber()
  @IsNotEmpty()
  electricityValue: number;

  @ApiProperty({
    description: 'Quantidade de energia SCEE (kWh)',
    example: 1007,
  })
  @IsNumber()
  @IsNotEmpty()
  sceeQuantity: number;

  @ApiProperty({
    description: 'Valor da energia SCEE (R$)',
    example: 502.35,
  })
  @IsNumber()
  @IsNotEmpty()
  sceeValue: number;

  @ApiProperty({
    description: 'Quantidade de energia compensada (kWh)',
    example: 1007,
  })
  @IsNumber()
  @IsNotEmpty()
  compensatedEnergyQuantity: number;

  @ApiProperty({
    description: 'Valor da energia compensada (R$)',
    example: -502.35,
  })
  @IsNumber()
  @IsNotEmpty()
  compensatedEnergyValue: number;

  @ApiProperty({
    description: 'Contribuição de iluminação pública (R$)',
    example: 49.43,
  })
  @IsNumber()
  @IsNotEmpty()
  publicLightingContribution: number;
}
