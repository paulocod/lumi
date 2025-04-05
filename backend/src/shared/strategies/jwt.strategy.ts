import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = configService.get<string>('app.jwt.secret');
    if (!secretKey) {
      throw new Error('JWT_SECRET não está configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: JwtPayload): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }
}
