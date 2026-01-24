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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SchedulesService } from '../schedules/schedules.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TrainersService } from '../trainers/trainers.service';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../attendance/dto/mark-attendance.dto';

@ApiTags('Trainer Portal')
@Controller('trainer')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class TrainerPortalController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly attendanceService: AttendanceService,
    private readonly trainersService: TrainersService,
  ) {}

  @Get('schedules')
  @ApiOperation({ summary: 'My schedules' })
  async mySchedules(@Req() req: { user: RequestUser }) {
    const trainer = await this.trainersService.findByUserId(Number(req.user.sub));
    if (!trainer) return [];
    return this.schedulesService.findByTrainer(trainer.id);
  }

  @Get('schedules/:id/customers')
  @ApiOperation({ summary: 'Customers in my class (for a given date)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-01-24' })
  async customersInClass(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
    @Req() req: { user: RequestUser },
  ) {
    if (!date) throw new BadRequestException('Query param date (YYYY-MM-DD) is required');
    const trainer = await this.trainersService.findByUserId(Number(req.user.sub));
    if (!trainer) return [];
    const schedule = await this.schedulesService.findOne(id);
    if (schedule.trainer_id !== trainer.id) return [];
    return this.attendanceService.getCustomersForAttendance(id, date);
  }

  @Post('attendance/mark')
  @ApiOperation({ summary: 'Mark attendance (single)' })
  async markAttendance(@Req() req: { user: RequestUser }, @Body() dto: MarkAttendanceDto) {
    return this.attendanceService.mark(dto, Number(req.user.sub));
  }

  @Post('attendance/mark/bulk')
  @ApiOperation({ summary: 'Mark attendance (bulk)' })
  async bulkMarkAttendance(@Req() req: { user: RequestUser }, @Body() dto: BulkMarkAttendanceDto) {
    return this.attendanceService.bulkMark(dto, Number(req.user.sub));
  }
}
