import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import type { AttendanceStatus, UserRole } from './interfaces/attendance.interface';
import { AttendanceStatusEnum, UserRoleEnum } from './interfaces/attendance.interface';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('customer', 'trainer')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Mark own attendance (Customer/Trainer)' })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiResponse({ status: 200, description: 'Attendance marked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin cannot use this endpoint' })
  async markOwnAttendance(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    // Ensure user_id is not provided (users can only mark their own attendance)
    if (createAttendanceDto.user_id) {
      throw new BadRequestException('Cannot specify user_id for self-marking');
    }
    return this.attendanceService.markOwnAttendance(createAttendanceDto, req.user.phone);
  }

  @Get('own')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('customer', 'trainer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get own attendance records (Customer/Trainer)' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns attendance records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOwnAttendance(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Req() req?: Request & { user: RequestUser },
  ) {
    if (!req?.user) {
      throw new BadRequestException('User not found in request');
    }
    return this.attendanceService.getOwnAttendance(req.user.phone, startDate, endDate);
  }

  @Post()
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Mark attendance for user (Admin)' })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiResponse({ status: 200, description: 'Attendance marked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or user not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async markAttendanceForUser(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    if (!createAttendanceDto.user_id) {
      throw new BadRequestException('user_id is required');
    }
    return this.attendanceService.markAttendanceForUser(
      createAttendanceDto,
      req.user.sub,
      req.user.name,
    );
  }

  @Post('bulk')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Bulk mark attendance for multiple users (Admin)' })
  @ApiBody({ type: BulkCreateAttendanceDto })
  @ApiResponse({ status: 200, description: 'Attendance marked for multiple users' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or invalid user_ids' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async bulkMarkAttendance(
    @Body() bulkDto: BulkCreateAttendanceDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.attendanceService.bulkMarkAttendance(bulkDto, req.user.sub, req.user.name);
  }

  @Get()
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all attendance records with filters (Admin)' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'user_role', required: false, enum: UserRoleEnum, description: 'Filter by user role' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, enum: AttendanceStatusEnum, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Returns attendance records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(
    @Query('user_id') userId?: string,
    @Query('user_role') userRole?: UserRole,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    return this.attendanceService.findAll({
      user_id: userId,
      user_role: userRole,
      start_date: startDate,
      end_date: endDate,
      status: status,
    });
  }

  @Get('user/:userId')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get attendance records by user ID (Admin)' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns attendance records for user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.attendanceService.findByUserId(userId, startDate, endDate);
  }

  @Patch(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update attendance record (Admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Attendance UUID' })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete attendance record (Admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.attendanceService.remove(id);
    return { success: true, message: 'Attendance record deleted successfully' };
  }

  @Get('stats')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get attendance statistics' })
  @ApiQuery({ name: 'user_id', required: false, description: 'User ID (admin only if provided)' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns attendance statistics' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid date format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Non-admin trying to get stats for another user' })
  async getStatistics(
    @Query('user_id') userId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Req() req?: Request & { user: RequestUser },
  ) {
    if (!req?.user) {
      throw new BadRequestException('User not found in request');
    }
    
    // If user_id is provided, only admins can access stats for other users
    if (userId && req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can get statistics for other users');
    }
    
    // Use provided user_id or authenticated user's ID
    const targetUserId = userId || req.user.sub;
    
    return this.attendanceService.getStatistics(targetUserId, startDate, endDate);
  }
}

