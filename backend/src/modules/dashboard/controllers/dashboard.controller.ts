import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardDataDto } from '../dtos/dashboard.dto';
import { DashboardService } from '../services/dashboard.service';
import { Auth } from '@/shared/decorators/auth.decorator';
import { Role } from '@prisma/client';

@ApiTags('dashboard')
@Controller('dashboard')
@Auth(Role.USER, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dados do dashboard' })
  @ApiQuery({
    name: 'clientNumber',
    required: false,
    description: 'Número do cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados consolidados',
    type: DashboardDataDto,
  })
  async getAllDashboardData(
    @Query('clientNumber') clientNumber?: string,
  ): Promise<DashboardDataDto> {
    return this.dashboardService.getAllDashboardData(clientNumber);
  }
}
