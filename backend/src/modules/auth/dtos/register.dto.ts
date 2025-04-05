import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Por favor, forneça um email válido' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description:
      'Senha do usuário (mínimo 8 caracteres, deve conter maiúsculas, minúsculas, números e caracteres especiais)',
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  password: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString({ message: 'O nome deve ser uma string válida' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  name: string;
}
