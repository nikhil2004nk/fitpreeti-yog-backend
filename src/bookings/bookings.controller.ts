import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiCookieAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(CookieJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or time slot already booked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User or service not found' })
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: Request & { user: RequestUser }) {
    return this.bookingsService.create(createBookingDto, req.user.phone);
  }

  @Get()
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all bookings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns user bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req: Request & { user: RequestUser }) {
    return this.bookingsService.getUserBookings(req.user.phone);
  }

  @Get(':id')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Returns the booking' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request & { user: RequestUser }) {
    return this.bookingsService.findOne(id, req.user.phone);
  }

  @Patch(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin', 'trainer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a booking (Admin or Trainer)' })
  @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Trainer access required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Cancel/delete a booking' })
  @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
  @ApiResponse({ status: 204, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request & { user: RequestUser }) {
    return this.bookingsService.remove(id, req.user.phone);
  }

  @Get('available/:serviceId/:date')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get available time slots for a service on a specific date' })
  @ApiParam({ name: 'serviceId', type: String, description: 'Service UUID' })
  @ApiParam({ name: 'date', type: String, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Returns available time slots' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailableSlots(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Param('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(serviceId, date);
  }

  @Get('admin/all')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin', 'trainer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all bookings (Admin or Trainer)' })
  @ApiResponse({ status: 200, description: 'Returns all bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Trainer access required' })
  findAllAdmin() {
    return this.bookingsService.findAll();
  }
}
