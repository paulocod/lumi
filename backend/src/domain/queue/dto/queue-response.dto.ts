import { ApiProperty } from '@nestjs/swagger';
import { QueueStats, JobStatus } from '../types/queue.types';
import { JobId } from 'bull';

export class QueueStatsResponseDto implements QueueStats {
  @ApiProperty({ description: 'Número de jobs aguardando' })
  waiting: number;

  @ApiProperty({ description: 'Número de jobs ativos' })
  active: number;

  @ApiProperty({ description: 'Número de jobs completados' })
  completed: number;

  @ApiProperty({ description: 'Número de jobs falhos' })
  failed: number;
}

export class JobStatusResponseDto implements JobStatus {
  @ApiProperty({ description: 'ID do job' })
  id: JobId;

  @ApiProperty({ description: 'Estado atual do job' })
  state: string;

  @ApiProperty({ description: 'Progresso do job (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Dados do job' })
  data: {
    pdfUrl: string;
    invoiceId: string;
  };

  @ApiProperty({ description: 'Timestamp do job' })
  timestamp: number;

  @ApiProperty({
    description: 'Data de início do processamento',
    required: false,
  })
  processedOn?: number;

  @ApiProperty({
    description: 'Data de conclusão do processamento',
    required: false,
  })
  finishedOn?: number;

  @ApiProperty({ description: 'Motivo da falha (se houver)', required: false })
  failedReason?: string;
}
