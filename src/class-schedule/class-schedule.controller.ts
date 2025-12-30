import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  UseGuards, 
  Query, 
  HttpCode, 
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiCookieAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassScheduleService } from './class-schedule.service';
import { ClassScheduleResponseDto } from './dto/class-schedule-response.dto';

@ApiTags('Class Schedule')
@Controller('api/v1/class-schedule')
export class ClassScheduleController {
  constructor(private readonly classScheduleService: ClassScheduleService) {}

  @Post()
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a new class schedule' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Class schedule successfully created', 
    type: ClassScheduleResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions' 
  })
  async create(
    @Body() createClassScheduleDto: CreateClassScheduleDto
  ): Promise<ClassScheduleResponseDto> {
    try {
      return await this.classScheduleService.create(createClassScheduleDto);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create class schedule');
    }
  }

  @Get()
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all class schedules' })
  @ApiQuery({ name: 'start_time', required: false, type: String })
  @ApiQuery({ name: 'end_time', required: false, type: String })
  @ApiQuery({ name: 'trainer_id', required: false, type: String })
  @ApiQuery({ name: 'service_id', required: false, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all class schedules', 
    type: [ClassScheduleResponseDto] 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async findAll(
    @Query('start_time') start_time?: string,
    @Query('end_time') end_time?: string,
    @Query('trainer_id') trainer_id?: string,
    @Query('service_id') service_id?: string,
  ): Promise<ClassScheduleResponseDto[]> {
    try {
      return await this.classScheduleService.findAll({
        start_time,
        end_time,
        trainer_id,
        service_id,
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch class schedules');
    }
  }

  @Get(':id')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get a class schedule by ID' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the class schedule', 
    type: ClassScheduleResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Class schedule not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async findOne(
    @Param('id') id: string
  ): Promise<ClassScheduleResponseDto> {
    try {
      return await this.classScheduleService.findOne(id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch class schedule');
    }
  }

  @Put(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a class schedule' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Class schedule updated successfully', 
    type: ClassScheduleResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Class schedule not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateClassScheduleDto: UpdateClassScheduleDto,
  ): Promise<ClassScheduleResponseDto> {
    return this.classScheduleService.update(id, updateClassScheduleDto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete a class schedule' })
  @ApiResponse({ status: 200, description: 'Class schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Class schedule not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.classScheduleService.remove(id);
  }

  @Get('trainer/:trainerId/availability')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
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
