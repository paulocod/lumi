import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthCheckResponse {
  status: 'ok' | 'error';
  message?: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<HealthCheckResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { status: 'error', message: errorMessage };
    }
  }
}
