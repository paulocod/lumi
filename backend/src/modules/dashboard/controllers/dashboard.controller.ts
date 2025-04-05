import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardDataDto } from '../dtos/dashboard.dto';
import { DashboardService } from '../services/dashboard.service';
import { Auth } from '@/shared/decorators/auth.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@Controller('dashboard')
@Auth(Role.USER, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obter todos os dados do dashboard consolidados' })
  @ApiQuery({
    name: 'clientNumber',
    required: false,
    description: 'Número do cliente para filtrar os dados',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data inicial para filtrar os dados (YYYY-MM-DD)',
    type: Date,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data final para filtrar os dados (YYYY-MM-DD)',
    type: Date,
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos os dados do dashboard consolidados',
    type: DashboardDataDto,
  })
  async getAllDashboardData(
    @Query('clientNumber') clientNumber?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<DashboardDataDto> {
    return this.dashboardService.getAllDashboardData(
      clientNumber,
      startDate,
      endDate,
    );
  }
}
