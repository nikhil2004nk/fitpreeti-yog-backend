import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { LeadStatus } from '../common/enums/lead.enums';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Leads (Admin)')
@Controller('admin/leads')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LeadsAdminController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assigned_to', required: false })
  @ApiQuery({ name: 'interested_in', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async list(
    @Query('status') status?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('interested_in') interested_in?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: Record<string, unknown> = {};
    if (status) filters.status = status as LeadStatus;
    if (assigned_to) filters.assigned_to = parseInt(assigned_to, 10);
    if (interested_in) filters.interested_in = interested_in;
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);
    return this.leadsService.findAll(filters as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add lead activity' })
  addActivity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: RequestUser },
    @Body() dto: CreateLeadActivityDto,
  ) {
    return this.leadsService.addActivity(id, Number(req.user.sub), dto);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'List lead activities' })
  listActivities(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findActivities(id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Mark lead as converted' })
  @ApiResponse({ status: 200, description: 'Lead marked converted.' })
  convert(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.convert(id);
  }
}
