import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../../presentation/auth/dto/login.dto';
import { RegisterDto } from '../../presentation/auth/dto/register.dto';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

type UserWithoutPassword = Omit<User, 'password'>;

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    const dto = registerDto as {
      email: string;
      password: string;
      name: string;
    };
    const { email, password, name } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserWithoutPassword;
  }> {
    const dto = loginDto as { email: string; password: string };
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

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

      const { accessToken } = this.generateTokens(user);
      return { access_token: accessToken };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
