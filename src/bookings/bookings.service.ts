import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './interfaces/booking.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingsService {
  constructor(private ch: ClickhouseService) {}

  /**
   * Normalize phone number by removing spaces, dashes, and other non-digit characters
   * Keeps only digits and leading + for country codes
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    // Remove all non-digit characters except leading +
    const cleaned = phone.trim();
    if (cleaned.startsWith('+')) {
      return '+' + cleaned.slice(1).replace(/\D/g, '');
    }
    return cleaned.replace(/\D/g, '');
  }

  async create(createBookingDto: CreateBookingDto, userPhone: string): Promise<Booking> {
    const normalizedPhone = this.normalizePhone(userPhone);
    
    // Get user_id from phone
    const escapedPhone = this.escapeSqlString(normalizedPhone);
    // Don't add FORMAT - ClickHouse service handles it automatically
    const userQuery = `SELECT id FROM fitpreeti.users WHERE phone = '${escapedPhone}' LIMIT 1`;
    const userResult = await this.ch.query<Array<{ id: string }>>(userQuery);
    
    if (!Array.isArray(userResult) || userResult.length === 0) {
      throw new NotFoundException('User not found');
    }
    const userId = userResult[0].id;
    
    // Check service exists - service_id is UUID, must be quoted
    const escapedServiceId = this.escapeSqlString(String(createBookingDto.service_id));
    const service = await this.ch.query<Array<{ id: string }>>(
      `SELECT id FROM fitpreeti.services WHERE id = '${escapedServiceId}'`
    );
    if (!Array.isArray(service) || service.length === 0) {
      throw new NotFoundException('Service not found');
    }

    // Check time slot availability - reuse escapedServiceId from above
    const escapedDate = this.escapeSqlString(createBookingDto.booking_date);
    const escapedTime = this.escapeSqlString(createBookingDto.booking_time);
    const conflict = await this.ch.query<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM fitpreeti.bookings WHERE service_id = '${escapedServiceId}' AND booking_date = '${escapedDate}' AND booking_time = '${escapedTime}' AND status != 'cancelled'`
    );
    if (Array.isArray(conflict) && conflict.length > 0 && (conflict[0]?.count || 0) > 0) {
      throw new BadRequestException('Time slot already booked');
    }

    const bookingId = uuidv4();
    const bookingData = {
      id: bookingId,
      user_id: userId,
      ...createBookingDto,
      user_phone: normalizedPhone,
      status: 'pending' as const,
    };

    await this.ch.insert('bookings', bookingData);
    
    return this.findOneByUser(bookingId, normalizedPhone);
  }

  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

  async findAll(userPhone?: string): Promise<Booking[]> {
    const normalizedPhone = userPhone ? this.normalizePhone(userPhone) : undefined;
    const whereClause = normalizedPhone ? `WHERE user_phone = '${normalizedPhone.replace(/'/g, "''")}'` : '';
    const result = await this.ch.query<Booking[]>(`
      SELECT * FROM fitpreeti.bookings 
      ${whereClause} 
      ORDER BY booking_date DESC, booking_time ASC
    `);
    return Array.isArray(result) ? result : [];
  }

  async findOne(id: string, userPhone?: string): Promise<Booking> {
    const normalizedPhone = userPhone ? this.normalizePhone(userPhone) : undefined;
    const escapedId = this.escapeSqlString(id);
    const whereClause = normalizedPhone ? `AND user_phone = '${this.escapeSqlString(normalizedPhone)}'` : '';
    // Don't add FORMAT - ClickHouse service handles it automatically
    const result = await this.ch.query<Booking[]>(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = '${escapedId}' ${whereClause}
    `);
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Booking not found');
    }
    return result[0];
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, userPhone?: string): Promise<Booking> {
    const existing = await this.findOne(id, userPhone);
    
    const updates: string[] = [];
    
    Object.entries(updateBookingDto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updates.push(`${key} = '${this.escapeSqlString(String(value))}'`);
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    const escapedId = this.escapeSqlString(id);
    // ClickHouse UPDATE syntax (lightweight)
    await this.ch.query(`
      ALTER TABLE fitpreeti.bookings 
      UPDATE ${updates.join(', ')} 
      WHERE id = '${escapedId}'
    `);
    
    // Add a small delay to ensure the update is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Retry mechanism to get the updated record
    const maxRetries = 5;
    let retries = 0;
    let result;
    
    while (retries < maxRetries) {
      const whereClause = userPhone 
        ? `id = '${escapedId}' AND user_phone = '${this.escapeSqlString(this.normalizePhone(userPhone))}'` 
        : `id = '${escapedId}'`;
      
      result = await this.ch.query<Booking[]>(`
        SELECT * FROM fitpreeti.bookings FINAL 
        WHERE ${whereClause}
      `);
      
      if (result && result.length > 0) {
        const updatedBooking = result[0];
        // Verify if the record was actually updated by checking one of the updated fields
        const updatedField = Object.keys(updateBookingDto)[0];
        if (updatedField && updatedBooking[updatedField] !== updateBookingDto[updatedField]) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        return updatedBooking;
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If we got here, we couldn't verify the update after retries
    // Return the record anyway, even if we can't verify the update
    const whereClause = userPhone 
      ? `id = '${escapedId}' AND user_phone = '${this.escapeSqlString(this.normalizePhone(userPhone))}'` 
      : `id = '${escapedId}'`;
    
    result = await this.ch.query<Booking[]>(`
      SELECT * FROM fitpreeti.bookings FINAL 
      WHERE ${whereClause}
    `);
    
    if (!result || result.length === 0) {
      throw new NotFoundException(`Booking with ID ${id} not found after update`);
    }
    
    return result[0];
  }

  async remove(id: string, userPhone?: string): Promise<void> {
    await this.findOne(id, userPhone); // Check if exists and user has access
    const escapedId = this.escapeSqlString(id);
    await this.ch.query(`ALTER TABLE fitpreeti.bookings DELETE WHERE id = '${escapedId}'`);
  }

  async getUserBookings(userPhone: string): Promise<Booking[]> {
    return this.findAll(userPhone);
  }

  async getAvailableSlots(serviceId: string, date: string): Promise<string[]> {
    // service_id is UUID, must be quoted
    const escapedServiceId = this.escapeSqlString(serviceId);
    const escapedDate = this.escapeSqlString(date);
    const result = await this.ch.query<Array<{ booking_time: string }>>(
      `SELECT booking_time FROM fitpreeti.bookings WHERE service_id = '${escapedServiceId}' AND booking_date = '${escapedDate}' AND status != 'cancelled'`
    );
    if (!Array.isArray(result)) {
      return [];
    }
    return result.map((slot) => slot.booking_time);
  }

  private async findOneByUser(id: string, userPhone: string): Promise<Booking> {
    const normalizedPhone = this.normalizePhone(userPhone);
    const escapedId = this.escapeSqlString(id);
    const escapedPhone = this.escapeSqlString(normalizedPhone);
    // Don't add FORMAT - ClickHouse service handles it automatically
    const result = await this.ch.query<Booking[]>(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = '${escapedId}' AND user_phone = '${escapedPhone}'
    `);
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Booking not found');
    }
    return result[0];
  }
}
