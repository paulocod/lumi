import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from './roles.decorator';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Não autorizado' }),
    ...(roles.length > 0 ? [Roles(...roles)] : []),
  );
}
