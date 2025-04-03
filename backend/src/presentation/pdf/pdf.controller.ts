/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Auth } from '../../domain/auth/decorators/auth.decorator';
import { Role } from '@prisma/client';
import { PdfService } from '@/domain/pdf/pdf.service';
import { CreateInvoiceDto } from '@/domain/invoice/dto/create-invoice.dto';

@ApiTags('pdf')
@Controller('pdf')
@Auth()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('extract')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Extrair dados de um arquivo PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF para extração',
          example: 'documento.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados extraídos com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Arquivo inválido ou não é um PDF',
  })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async extractInvoice(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreateInvoiceDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('O arquivo deve ser um PDF');
    }

    try {
      return await this.pdfService.extractInvoiceFromPdf(file.buffer);
    } catch (error) {
      throw new BadRequestException('Erro ao processar o arquivo PDF', error);
    }
  }
}
