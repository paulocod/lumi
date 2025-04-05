import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthService } from './services/health.service';
import { LoggerModule } from '../../config/logger';
import { PrismaModule } from 'prisma/prisma.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [TerminusModule, PrismaModule, LoggerModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
