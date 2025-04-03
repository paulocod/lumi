import { Controller, Get, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Queue')
@Controller('queue')
export class InvoiceQueueController {
  private readonly logger = new Logger(InvoiceQueueController.name);

  constructor(
    @InjectQueue('invoice-processing')
    private invoiceQueue: Queue,
  ) {}

  @Get('status')
  async getQueueStatus() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.invoiceQueue.getWaitingCount(),
        this.invoiceQueue.getActiveCount(),
        this.invoiceQueue.getCompletedCount(),
        this.invoiceQueue.getFailedCount(),
      ]);

      return { waiting, active, completed, failed };
    } catch (error) {
      this.logger.error('Erro ao obter status da fila', error);
      throw error;
    }
  }
}
