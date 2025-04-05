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
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
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
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas de login',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}
