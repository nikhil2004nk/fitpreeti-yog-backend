import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './interfaces/booking.interface';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../services/services.service';
import { ClassScheduleService } from '../class-schedule/class-schedule.service';
import { ClassStatus } from '../class-schedule/entities/class-schedule.entity';

@Injectable()
export class BookingsService {
  private readonly database: string;

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
    private servicesService: ServicesService,
    private classScheduleService: ClassScheduleService,
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
    // Normalize date format - handle both YYYY-MM-DD and DD-MM-YYYY
    let normalizedDate = date.trim();
    
    // Try to parse and normalize the date
    let dateObj: Date;
    
    // Check if it's in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(normalizedDate)) {
      const [day, month, year] = normalizedDate.split('-');
      normalizedDate = `${year}-${month}-${day}`;
      dateObj = new Date(normalizedDate + 'T00:00:00.000Z');
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      // Already in YYYY-MM-DD format
      dateObj = new Date(normalizedDate + 'T00:00:00.000Z');
    } else {
      // Try to parse as-is
      dateObj = new Date(normalizedDate);
    }
    
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException(`Invalid date format: ${date}. Expected YYYY-MM-DD or DD-MM-YYYY`);
    }
    
    // Normalize to YYYY-MM-DD format
    normalizedDate = dateObj.toISOString().split('T')[0];
    
    // Get class schedules for this service
    const allSchedules = await this.classScheduleService.findAll({
      service_id: serviceId,
    });
    
    // Filter schedules that fall on the requested date and are scheduled
    const classSchedules = allSchedules.filter(schedule => {
      // First check status and capacity
      if (schedule.status !== ClassStatus.SCHEDULED || schedule.current_participants >= schedule.max_participants) {
        return false;
      }
      
      const scheduleStart = new Date(schedule.start_time);
      const scheduleDate = scheduleStart.toISOString().split('T')[0];
      const requestedDate = new Date(normalizedDate + 'T00:00:00.000Z');
      const startDate = new Date(schedule.start_time);
      const startDateOnly = startDate.toISOString().split('T')[0];
      
      // Check if this is a recurring class that falls on the requested date
      if (schedule.is_recurring && schedule.recurrence_pattern) {
        // Check if requested date is within the recurrence range
        if (schedule.recurrence_end_date) {
          const endDate = new Date(schedule.recurrence_end_date);
          const endDateOnly = endDate.toISOString().split('T')[0];
          
          // Check if requested date is before start or after end
          if (normalizedDate < startDateOnly || normalizedDate > endDateOnly) {
            return false;
          }
        } else {
          // No end date, but requested date must be >= start date
          if (normalizedDate < startDateOnly) {
            return false;
          }
        }
        
        // Check recurrence pattern
        if (schedule.recurrence_pattern.toLowerCase() === 'daily') {
          // Daily: any date between start and end (already checked above)
          return true;
        } else if (schedule.recurrence_pattern.toLowerCase() === 'weekly') {
          // Weekly: same day of week
          const startDayOfWeek = startDate.getUTCDay();
          const requestedDayOfWeek = requestedDate.getUTCDay();
          return startDayOfWeek === requestedDayOfWeek;
        } else if (schedule.recurrence_pattern.toLowerCase() === 'monthly') {
          // Monthly: same day of month
          return startDate.getUTCDate() === requestedDate.getUTCDate();
        }
        
        // Unknown pattern, fall through to exact match
      }
      
      // For non-recurring: exact date match
      return scheduleDate === normalizedDate;
    });
    
    // Extract available time slots from class schedules
    const availableSlots: string[] = [];
    
    for (const schedule of classSchedules) {
      // Extract time from the schedule's start_time
      // Parse the ISO string to get the original time components
      const startTime = new Date(schedule.start_time);
      
      // For recurring classes, use the original start time's hour/minute
      // Extract from the ISO string to preserve the original time
      const isoString = startTime.toISOString();
      const timeMatch = isoString.match(/T(\d{2}):(\d{2})/);
      
      let hours: number;
      let minutes: number;
      
      if (timeMatch) {
        // Use UTC time from the ISO string (this is what was originally stored)
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
      } else {
        // Fallback to local time extraction
        hours = startTime.getUTCHours();
        minutes = startTime.getUTCMinutes();
      }
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Check if this slot is already booked
      const bookedQuery = `
        SELECT COUNT(*) as count
        FROM ${this.database}.bookings 
        WHERE service_id = {serviceId:String} 
          AND booking_date = {date:String} 
          AND booking_time = {time:String}
          AND status != 'cancelled'
      `;
      const bookedResult = await this.ch.queryParams<Array<{ count: number }>>(bookedQuery, {
        serviceId: sanitizeText(serviceId),
        date: sanitizeText(normalizedDate),
        time: timeString,
      });
      
      const isBooked = Array.isArray(bookedResult) && bookedResult.length > 0 && (bookedResult[0]?.count || 0) > 0;
      
      // Add slot if not already booked and not already in the list
      if (!isBooked && !availableSlots.includes(timeString)) {
        availableSlots.push(timeString);
      }
    }
    
    // If no available slots found, fall back to business hours approach
    // This handles cases where: no schedules exist, schedules don't match the date, or all slots are booked
    if (availableSlots.length === 0) {
      // Get service details to determine duration and generate slots
      const service = await this.servicesService.findOne(serviceId);
      const durationMinutes = service.duration_minutes || 60; // Default to 60 minutes
      
      // Business hours: 9:00 AM to 6:00 PM (9:00 to 18:00)
      const startHour = 9;
      const endHour = 18;
      const slotInterval = durationMinutes; // Use service duration as interval
      
      // Generate all possible time slots for the day
      const allSlots: string[] = [];
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          // Calculate end time for this slot
          const endMinute = minute + slotInterval;
          const endHourForSlot = hour + Math.floor(endMinute / 60);
          const endMinuteForSlot = endMinute % 60;
          
          // Skip slots that would end after business hours
          if (endHourForSlot > endHour || (endHourForSlot === endHour && endMinuteForSlot > 0)) {
            break;
          }
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push(timeString);
        }
      }
      
      // Get all booked slots for this service and date
      const bookedQuery = `
        SELECT booking_time 
        FROM ${this.database}.bookings 
        WHERE service_id = {serviceId:String} 
          AND booking_date = {date:String} 
          AND status != 'cancelled'
      `;
      const bookedResult = await this.ch.queryParams<Array<{ booking_time: string }>>(bookedQuery, {
        serviceId: sanitizeText(serviceId),
        date: sanitizeText(normalizedDate),
      });
      
      const bookedSlots = Array.isArray(bookedResult) 
        ? bookedResult.map((slot) => slot.booking_time)
        : [];
      
      // Return available slots (all slots minus booked slots)
      return allSlots.filter(slot => !bookedSlots.includes(slot));
    }
    
    // Sort slots by time
    return availableSlots.sort();
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
