import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Por favor, forneça um email válido' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha do usuário',
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;
}
