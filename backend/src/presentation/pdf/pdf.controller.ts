import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from '../../domain/pdf/pdf.service';
import { CreateInvoiceDto } from '../../domain/invoice/dto/create-invoice.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Extrair dados de fatura de um arquivo PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Dados extraídos com sucesso',
    type: CreateInvoiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou erro na extração',
  })
  async extractInvoice(
    @UploadedFile() file: MulterFile,
  ): Promise<CreateInvoiceDto> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('O arquivo deve ser um PDF');
    }

    return this.pdfService.extractInvoiceFromPdf(file.buffer);
  }
}
