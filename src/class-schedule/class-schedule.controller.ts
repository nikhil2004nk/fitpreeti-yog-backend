import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassScheduleService } from './class-schedule.service';
import { ClassScheduleResponseDto } from './dto/class-schedule-response.dto';

@ApiTags('class-schedule')
@Controller('api/v1/class-schedule')
export class ClassScheduleController {
  constructor(private readonly classScheduleService: ClassScheduleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new class schedule' })
  @ApiResponse({ status: 201, description: 'Class schedule successfully created', type: ClassScheduleResponseDto })
  async create(@Body() createClassScheduleDto: CreateClassScheduleDto): Promise<ClassScheduleResponseDto> {
    return this.classScheduleService.create(createClassScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all class schedules' })
  @ApiResponse({ status: 200, description: 'Return all class schedules', type: [ClassScheduleResponseDto] })
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('trainerId') trainerId?: string,
    @Query('serviceId') serviceId?: string,
  ): Promise<ClassScheduleResponseDto[]> {
    return this.classScheduleService.findAll({
      startDate,
      endDate,
      trainerId,
      serviceId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a class schedule by ID' })
  @ApiResponse({ status: 200, description: 'Return the class schedule', type: ClassScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Class schedule not found' })
  async findOne(@Param('id') id: string): Promise<ClassScheduleResponseDto> {
    return this.classScheduleService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a class schedule' })
  @ApiResponse({ status: 200, description: 'Class schedule updated successfully', type: ClassScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Class schedule not found' })
  async update(
    @Param('id') id: string,
    @Body() updateClassScheduleDto: UpdateClassScheduleDto,
  ): Promise<ClassScheduleResponseDto> {
    return this.classScheduleService.update(id, updateClassScheduleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a class schedule' })
  @ApiResponse({ status: 200, description: 'Class schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Class schedule not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.classScheduleService.remove(id);
  }

  @Get('trainer/:trainerId/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check trainer availability' })
  @ApiResponse({ status: 200, description: 'Returns available time slots for the trainer' })
  async checkTrainerAvailability(
    @Param('trainerId') trainerId: string,
    @Query('date') date: string,
    @Query('duration') duration: number,
  ) {
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + duration * 60000); // Convert minutes to milliseconds
    return this.classScheduleService.checkTrainerAvailability(trainerId, startTime, endTime);
  }
}
