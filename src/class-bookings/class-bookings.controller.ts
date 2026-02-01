import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClassBookingsService } from './class-bookings.service';
import { CreateClassBookingDto } from './dto/create-class-booking.dto';
import { UpdateClassBookingDto } from './dto/update-class-booking.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ClassBookingStatus } from './entities/class-booking.entity';

@ApiTags('Class Bookings (Admin)')
@Controller('admin/class-bookings')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ClassBookingsController {
  constructor(private readonly service: ClassBookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Book customer to a class schedule (onboarding flow)' })
  @ApiResponse({ status: 201, description: 'Class booking created; booking_dates computed from schedule available_dates ∩ start/end' })
  create(@Body() dto: CreateClassBookingDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all class bookings' })
  @ApiQuery({ name: 'customer_id', required: false })
  @ApiQuery({ name: 'schedule_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Query('customer_id') customer_id?: string,
    @Query('schedule_id') schedule_id?: string,
    @Query('status') status?: string,
  ) {
    const filters: { customer_id?: number; schedule_id?: number; status?: ClassBookingStatus } = {};
    if (customer_id) filters.customer_id = parseInt(customer_id, 10);
    if (schedule_id) filters.schedule_id = parseInt(schedule_id, 10);
    if (status) filters.status = status as ClassBookingStatus;
    return this.service.findAll(filters);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get class bookings for a customer' })
  getByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.service.findByCustomer(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class booking by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update class booking (start/end); recomputes booking_dates' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClassBookingDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel class booking' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }
}
