import { IsString, IsDate, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  clientNumber: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  referenceMonth: Date;

  @IsNumber()
  @IsNotEmpty()
  electricityQuantity: number;

  @IsNumber()
  @IsNotEmpty()
  electricityValue: number;

  @IsNumber()
  @IsNotEmpty()
  sceeQuantity: number;

  @IsNumber()
  @IsNotEmpty()
  sceeValue: number;

  @IsNumber()
  @IsNotEmpty()
  compensatedEnergyQuantity: number;

  @IsNumber()
  @IsNotEmpty()
  compensatedEnergyValue: number;

  @IsNumber()
  @IsNotEmpty()
  publicLightingContribution: number;
}
