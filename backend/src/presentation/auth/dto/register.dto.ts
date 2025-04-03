import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email do usuário',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome do usuário',
  })
  @IsString()
  name: string;
}
