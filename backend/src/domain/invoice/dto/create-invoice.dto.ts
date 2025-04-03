import {
  IsString,
  IsDate,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../enums/invoice-status.enum';

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
  publicLightingValue: number;

  @ApiProperty({
    description: 'URL do PDF da fatura',
    example: 'https://example.com/invoice.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @ApiProperty({
    description: 'Status do processamento da fatura',
    example: InvoiceStatus.COMPLETED,
    enum: InvoiceStatus,
    default: InvoiceStatus.COMPLETED,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
