import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';

export class InvoiceFilterDto {
  @ApiProperty({
    description: 'Número do cliente',
    example: '7005400387',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientNumber?: string;

  @ApiProperty({
    description: 'Status da fatura',
    enum: InvoiceStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Data inicial para filtro de período',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    description: 'Data final para filtro de período',
    example: '2024-12-31T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    description: 'Mês específico para filtro',
    example: '2024-03-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  month?: Date;

  @ApiProperty({
    description: 'Número da página para paginação',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
