import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import {
  InvalidCredentialsError,
  EmailInUseError,
} from '../errors/auth.errors';

type UserWithoutPassword = Omit<User, 'password'>;

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = [
      this.jwtService.sign(payload, { expiresIn: '15m' }),
      this.jwtService.sign(payload, { expiresIn: '7d' }),
    ];

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto): Promise<UserWithoutPassword> {
    const { email, password, name } = registerDto;

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(
          `Tentativa de registro com email já existente: ${email}`,
        );
        throw new EmailInUseError();
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      this.logger.log(`Novo usuário registrado: ${email}`);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof EmailInUseError) {
        throw new UnauthorizedException(error.message);
      }
      this.logger.error(
        `Erro ao registrar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserWithoutPassword;
  }> {
    const { email, password } = loginDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(
          `Tentativa de login com email não existente: ${email}`,
        );
        throw new InvalidCredentialsError();
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(
          `Tentativa de login com senha inválida para: ${email}`,
        );
        throw new InvalidCredentialsError();
      }

      const { accessToken, refreshToken } = this.generateTokens(user);

      await this.cacheManager.set(
        `refresh_token:${user.id}`,
        refreshToken,
        7 * 24 * 60 * 60 * 1000,
      );

      this.logger.log(`Login bem-sucedido para: ${email}`);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      this.logger.error(
        `Erro no processo de login: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }

      const cachedRefreshToken = await this.cacheManager.get<string>(
        `refresh_token:${user.id}`,
      );

      if (!cachedRefreshToken || cachedRefreshToken !== refreshToken) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      const { accessToken } = this.generateTokens(user);
      return { access_token: accessToken };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
