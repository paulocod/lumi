import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { LoginThrottlerGuard } from '../../../shared/guards/login-throttler.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @ApiResponse({
    status: 429,
    description: 'Limite de tentativas excedido',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovação de token' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}
