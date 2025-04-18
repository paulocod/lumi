import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigModule } from '@/config/config.module';
import { JwtStrategy } from '@/shared/strategies/jwt.strategy';
import { LoginThrottlerGuard } from '@/shared/guards/login-throttler.guard';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('app.jwt.expiration'),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get('redis.url'),
        ttl: configService.get('cache.ttl'),
        max: configService.get('cache.max'),
        prefix: 'auth:',
        database: 0,
        password: configService.get('redis.password'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoginThrottlerGuard, Logger],
  exports: [AuthService],
})
export class AuthModule {}
