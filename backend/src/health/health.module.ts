import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { LoggerModule } from '../config/logger';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [TerminusModule, PrismaModule, LoggerModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
