import { ApiProperty } from '@nestjs/swagger';

export class UnprocessedPdfDto {
  @ApiProperty({
    description: 'Nome do objeto no bucket',
    example: '1743975089330-invoice-new.pdf',
  })
  objectName: string;

  @ApiProperty({
    description: 'Data de upload do PDF',
    example: '2024-03-04T12:34:56.789Z',
  })
  uploadDate: Date;
}

export class UnprocessedPdfListDto {
  @ApiProperty({
    description: 'Lista de PDFs não processados',
    type: [UnprocessedPdfDto],
  })
  pdfs: UnprocessedPdfDto[];

  @ApiProperty({
    description: 'Total de PDFs não processados',
    example: 5,
  })
  total: number;
}
