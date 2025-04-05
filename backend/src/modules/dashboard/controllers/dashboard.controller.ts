import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DashboardSummaryDto,
  EnergyDataDto,
  FinancialDataDto,
} from '../dtos/dashboard.dto';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('energy')
  @ApiOperation({ summary: 'Obter dados de consumo de energia' })
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
    description: 'Retorna os dados de consumo de energia',
    type: [EnergyDataDto],
  })
  async getEnergyData(
    @Query('clientNumber') clientNumber?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<EnergyDataDto[]> {
    return this.dashboardService.getEnergyData(
      clientNumber,
      startDate,
      endDate,
    );
  }

  @Get('financial')
  @ApiOperation({ summary: 'Obter dados financeiros' })
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
    description: 'Retorna os dados financeiros',
    type: [FinancialDataDto],
  })
  async getFinancialData(
    @Query('clientNumber') clientNumber?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<FinancialDataDto[]> {
    return this.dashboardService.getFinancialData(
      clientNumber,
      startDate,
      endDate,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obter resumo dos dados do dashboard' })
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
  async getSummary(
    @Query('clientNumber') clientNumber?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(clientNumber, startDate, endDate);
  }
}
