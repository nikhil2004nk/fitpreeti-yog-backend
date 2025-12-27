import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './interfaces/booking.interface';

@Injectable()
export class BookingsService {
  constructor(private ch: ClickhouseService) {}

  async create(createBookingDto: CreateBookingDto, userPhone: string): Promise<Booking> {
    // Check service exists
    const service = await this.ch.query(`SELECT id FROM fitpreeti.services WHERE id = ${createBookingDto.service_id}`);
    const serviceData = await service.json();
    if (!serviceData.length) {
      throw new NotFoundException('Service not found');
    }

    // Check time slot availability
    const conflict = await this.ch.query(`
      SELECT COUNT(*) as count 
      FROM fitpreeti.bookings 
      WHERE service_id = ${createBookingDto.service_id} 
      AND booking_date = '${createBookingDto.booking_date}'
      AND booking_time = '${createBookingDto.booking_time}'
      AND status != 'cancelled'
    `);
    const conflictData = await conflict.json();
    if ((conflictData[0]?.count || 0) > 0) {
      throw new BadRequestException('Time slot already booked');
    }

    const bookingData = {
      ...createBookingDto,
      user_phone: userPhone,
      status: 'pending' as const,
    };

    await this.ch.insert('bookings', bookingData);
    
    return this.findOneByUser((await this.ch.query(`
      SELECT id FROM fitpreeti.bookings 
      WHERE user_phone = '${userPhone}' 
      AND booking_date = '${createBookingDto.booking_date}'
      AND booking_time = '${createBookingDto.booking_time}'
      ORDER BY created_at DESC LIMIT 1
    `)).json()[0]?.id || 0, userPhone);
  }

  async findAll(userPhone?: string): Promise<Booking[]> {
    const whereClause = userPhone ? `WHERE user_phone = '${userPhone}'` : '';
    const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      ${whereClause} 
      ORDER BY booking_date DESC, booking_time ASC
    `);
    return await result.json();
  }

  async findOne(id: number, userPhone?: string): Promise<Booking> {
    const whereClause = userPhone ? `AND user_phone = '${userPhone}'` : '';
    const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = ${id} ${whereClause}
    `);
    const data = await result.json();
    
    if (!data.length) {
      throw new NotFoundException('Booking not found');
    }
    return data[0];
  }

  async update(id: number, updateBookingDto: UpdateBookingDto, userPhone?: string): Promise<Booking> {
    const existing = await this.findOne(id, userPhone);
    
    const updates: string[] = [];
    
    Object.entries(updateBookingDto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updates.push(`${key} = '${value}'`);
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    // ClickHouse UPDATE syntax (lightweight)
    await this.ch.query(`
      ALTER TABLE fitpreeti.bookings 
      UPDATE ${updates.join(', ')} 
      WHERE id = ${id}
    `);

    return this.findOne(id, userPhone);
  }

  async remove(id: number, userPhone?: string): Promise<void> {
    await this.findOne(id, userPhone); // Check if exists and user has access
    await this.ch.query(`ALTER TABLE fitpreeti.bookings DELETE WHERE id = ${id}`);
  }

  async getUserBookings(userPhone: string): Promise<Booking[]> {
    return this.findAll(userPhone);
  }

  async getAvailableSlots(serviceId: number, date: string): Promise<string[]> {
    const result = await this.ch.query(`
      SELECT booking_time 
      FROM fitpreeti.bookings 
      WHERE service_id = ${serviceId} 
      AND booking_date = '${date}'
      AND status != 'cancelled'
    `);
    const bookedSlots = await result.json();
    return bookedSlots.map((slot: any) => slot.booking_time);
  }

  private async findOneByUser(id: number, userPhone: string): Promise<Booking> {
    const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = ${id} AND user_phone = '${userPhone}'
    `);
    const data = await result.json();
    
    if (!data.length) {
      throw new NotFoundException('Booking not found');
    }
    return data[0];
  }
}
