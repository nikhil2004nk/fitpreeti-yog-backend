import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user.interface';
import type { Request } from 'express';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(CookieJwtGuard)
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: Request) {
    return this.bookingsService.create(createBookingDto, (req.user as any).phone);
  }

  @Get()
  @UseGuards(CookieJwtGuard)
  findAll(@Req() req: Request) {
    const userPhone = (req.user as any).phone;
    return this.bookingsService.getUserBookings(userPhone);
  }

  @Get(':id')
  @UseGuards(CookieJwtGuard)
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.bookingsService.findOne(id, (req.user as any).phone);
  }

  @Patch(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.bookingsService.remove(id, (req.user as any).phone);
  }

  @Get('available/:serviceId/:date')
  @UseGuards(CookieJwtGuard)
  async getAvailableSlots(@Param('serviceId') serviceId: string, @Param('date') date: string) {
    return this.bookingsService.getAvailableSlots(serviceId, date);
  }

  // Admin: All bookings
  @Get('admin/all')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  findAllAdmin() {
    return this.bookingsService.findAll();
  }
}
