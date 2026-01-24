import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Attendance')
@Controller('admin/attendance')
@UseGuards(CookieJwtGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('schedule/:scheduleId/date/:date')
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Get customers for attendance (schedule + date)' })
  getForSchedule(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Param('date') date: string,
  ) {
    return this.service.getCustomersForAttendance(scheduleId, date);
  }

  @Post('mark')
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Mark attendance (single)' })
  mark(@Req() req: { user: RequestUser }, @Body() dto: MarkAttendanceDto) {
    return this.service.mark(dto, Number(req.user.sub));
  }

  @Post('mark/bulk')
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Mark attendance (bulk)' })
  bulkMark(@Req() req: { user: RequestUser }, @Body() dto: BulkMarkAttendanceDto) {
    return this.service.bulkMark(dto, Number(req.user.sub));
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer attendance history' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findByCustomer(customerId, startDate, endDate);
  }
}
