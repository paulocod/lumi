import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../config/logger.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    this.logger.debug(
      'Iniciando verificação de saúde do sistema',
      'HealthCheck',
    );

    const result = await this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          thresholdPercent: 0.9,
          path: '/',
        }),
    ]);

    if (result.status === 'ok') {
      this.logger.log(
        'Verificação de saúde concluída com sucesso',
        'HealthCheck',
      );
    } else {
      this.logger.warn(
        'Verificação de saúde concluída com avisos',
        'HealthCheck',
      );
    }

    return result;
  }
}
