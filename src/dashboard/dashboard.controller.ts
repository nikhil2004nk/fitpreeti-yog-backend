import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Dashboard (Admin)')
@Controller('admin/dashboard')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard statistics' })
  stats() {
    return this.service.getStats();
  }

  @Get('reports/leads')
  @ApiOperation({ summary: 'Lead conversion report' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  leadReport(@Query('months') months?: string) {
    return this.service.getLeadConversionReport(months ? parseInt(months, 10) : 6);
  }
}
