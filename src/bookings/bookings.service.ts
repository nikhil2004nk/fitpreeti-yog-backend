import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './interfaces/booking.interface';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BookingsService {
  private readonly database: string;

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async create(createBookingDto: CreateBookingDto, userPhone: string): Promise<Booking> {
    const normalizedPhone = normalizePhone(sanitizeText(userPhone));
    
    // Get user_id from phone using parameterized query
    const userQuery = `SELECT id FROM ${this.database}.users WHERE phone = {phone:String} LIMIT 1`;
    const userResult = await this.ch.queryParams<Array<{ id: string }>>(userQuery, { phone: normalizedPhone });
    
    if (!Array.isArray(userResult) || userResult.length === 0) {
      throw new NotFoundException('User not found');
    }
    const userId = userResult[0].id;
    
    // Check service exists using parameterized query
    const serviceQuery = `SELECT id FROM ${this.database}.services WHERE id = {serviceId:String} LIMIT 1`;
    const service = await this.ch.queryParams<Array<{ id: string }>>(serviceQuery, { 
      serviceId: String(createBookingDto.service_id) 
    });
    if (!Array.isArray(service) || service.length === 0) {
      throw new NotFoundException('Service not found');
    }

    // Check time slot availability using parameterized query
    const conflictQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.database}.bookings 
      WHERE service_id = {serviceId:String} 
        AND booking_date = {date:String} 
        AND booking_time = {time:String} 
        AND status != 'cancelled'
    `;
    const conflict = await this.ch.queryParams<Array<{ count: number }>>(conflictQuery, {
      serviceId: String(createBookingDto.service_id),
      date: sanitizeText(createBookingDto.booking_date),
      time: sanitizeText(createBookingDto.booking_time),
    });
    if (Array.isArray(conflict) && conflict.length > 0 && (conflict[0]?.count || 0) > 0) {
      throw new BadRequestException('Time slot already booked');
    }

    const bookingId = uuidv4();
    const bookingData = {
      id: bookingId,
      user_id: userId,
      service_id: createBookingDto.service_id,
      booking_date: sanitizeText(createBookingDto.booking_date),
      booking_time: sanitizeText(createBookingDto.booking_time),
      user_phone: normalizedPhone,
      status: 'pending' as const,
    };

    await this.ch.insert('bookings', bookingData);
    
    return this.findOneByUser(bookingId, normalizedPhone);
  }

  async findAll(userPhone?: string): Promise<Booking[]> {
    const normalizedPhone = userPhone ? normalizePhone(sanitizeText(userPhone)) : undefined;
    
    if (normalizedPhone) {
      const query = `
        SELECT * FROM ${this.database}.bookings 
        WHERE user_phone = {phone:String}
        ORDER BY booking_date DESC, booking_time ASC
      `;
      const result = await this.ch.queryParams<Booking[]>(query, { phone: normalizedPhone });
      return Array.isArray(result) ? result : [];
    }
    
    const query = `
      SELECT * FROM ${this.database}.bookings 
      ORDER BY booking_date DESC, booking_time ASC
    `;
    const result = await this.ch.queryParams<Booking[]>(query, {});
    return Array.isArray(result) ? result : [];
  }

  async findOne(id: string, userPhone?: string): Promise<Booking> {
    const normalizedPhone = userPhone ? normalizePhone(sanitizeText(userPhone)) : undefined;
    
    if (normalizedPhone) {
      const query = `
        SELECT * FROM ${this.database}.bookings 
        WHERE id = {id:String} AND user_phone = {phone:String}
        LIMIT 1
      `;
      const result = await this.ch.queryParams<Booking[]>(query, { id, phone: normalizedPhone });
      if (!Array.isArray(result) || result.length === 0) {
        throw new NotFoundException('Booking not found');
      }
      return result[0];
    }
    
    const query = `
      SELECT * FROM ${this.database}.bookings 
      WHERE id = {id:String}
      LIMIT 1
    `;
    const result = await this.ch.queryParams<Booking[]>(query, { id });
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Booking not found');
    }
    return result[0];
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, userPhone?: string): Promise<Booking> {
    const existing = await this.findOne(id, userPhone);
    
    // Sanitize update data
    const sanitizedUpdates: Record<string, any> = {};
    Object.entries(updateBookingDto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitizedUpdates[key] = typeof value === 'string' ? sanitizeText(value) : value;
      }
    });

    if (Object.keys(sanitizedUpdates).length === 0) {
      return existing;
    }

    // Build update query - Note: ClickHouse parameterized queries have limitations for ALTER TABLE UPDATE
    // So we use the legacy query method but with sanitized values
    const updates = Object.entries(sanitizedUpdates)
      .map(([key, value]) => `${key} = '${String(value).replace(/'/g, "''")}'`)
      .join(', ');
    
    const updateQuery = `
      ALTER TABLE ${this.database}.bookings 
      UPDATE ${updates} 
      WHERE id = {id:String}
    `;
    await this.ch.queryParams(updateQuery, { id });
    
    // Wait for update to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return updated booking
    return this.findOne(id, userPhone);
  }

  async remove(id: string, userPhone?: string): Promise<void> {
    await this.findOne(id, userPhone); // Check if exists and user has access
    const deleteQuery = `ALTER TABLE ${this.database}.bookings DELETE WHERE id = {id:String}`;
    await this.ch.queryParams(deleteQuery, { id });
  }

  async getUserBookings(userPhone: string): Promise<Booking[]> {
    return this.findAll(userPhone);
  }

  async getAvailableSlots(serviceId: string, date: string): Promise<string[]> {
    const query = `
      SELECT booking_time 
      FROM ${this.database}.bookings 
      WHERE service_id = {serviceId:String} 
        AND booking_date = {date:String} 
        AND status != 'cancelled'
    `;
    const result = await this.ch.queryParams<Array<{ booking_time: string }>>(query, {
      serviceId: sanitizeText(serviceId),
      date: sanitizeText(date),
    });
    if (!Array.isArray(result)) {
      return [];
    }
    return result.map((slot) => slot.booking_time);
  }

  private async findOneByUser(id: string, userPhone: string): Promise<Booking> {
    const normalizedPhone = normalizePhone(sanitizeText(userPhone));
    const query = `
      SELECT * FROM ${this.database}.bookings 
      WHERE id = {id:String} AND user_phone = {phone:String}
      LIMIT 1
    `;
    const result = await this.ch.queryParams<Booking[]>(query, { id, phone: normalizedPhone });
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Booking not found');
    }
    return result[0];
  }
}
