import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';
import { ServicesService } from '../services/services.service';
import { Not } from 'typeorm';
import { BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userPhone: string): Promise<Booking> {
    const normalizedPhone = normalizePhone(sanitizeText(userPhone));
    
    // Get user_id from phone
    const user = await this.userRepository.findOne({ 
      where: { phone: normalizedPhone },
      select: ['id'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userId = user.id;
    
    // Check service exists and get price
    const service = await this.serviceRepository.findOne({ 
      where: { id: createBookingDto.service_id },
      select: ['id', 'price'],
    });
    
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const servicePrice = service.price;

    // Check time slot availability
    const conflict = await this.bookingRepository.count({
      where: {
        service_id: createBookingDto.service_id,
        booking_date: new Date(createBookingDto.booking_date),
        booking_time: sanitizeText(createBookingDto.booking_time),
        status: Not(BookingStatus.CANCELLED),
      },
    });
    
    if (conflict > 0) {
      throw new BadRequestException('Time slot already booked');
    }

    // Use provided amount or fallback to service price
    const bookingAmount = createBookingDto.amount !== undefined ? createBookingDto.amount : servicePrice;
    
    const booking = this.bookingRepository.create({
      user_id: userId,
      service_id: createBookingDto.service_id,
      booking_date: new Date(createBookingDto.booking_date),
      booking_time: sanitizeText(createBookingDto.booking_time),
      user_phone: normalizedPhone,
      full_name: sanitizeText(createBookingDto.full_name),
      email: sanitizeText(createBookingDto.email),
      phone: normalizePhone(sanitizeText(createBookingDto.phone)),
      special_requests: createBookingDto.special_requests ? sanitizeText(createBookingDto.special_requests) : null,
      amount: bookingAmount,
      status: BookingStatus.PENDING,
      start_time: new Date(createBookingDto.booking_date + 'T' + createBookingDto.booking_time),
      end_time: new Date(createBookingDto.booking_date + 'T' + createBookingDto.booking_time),
      payment_status: 'pending' as any,
    });

    const savedBooking = await this.bookingRepository.save(booking);
    
    return this.findOneByUser(savedBooking.id, normalizedPhone);
  }

  async findAll(userPhone?: string): Promise<Booking[]> {
    const normalizedPhone = userPhone ? normalizePhone(sanitizeText(userPhone)) : undefined;
    
    if (normalizedPhone) {
      return await this.bookingRepository.find({
        where: { user_phone: normalizedPhone },
        order: { booking_date: 'DESC', booking_time: 'ASC' },
      });
    }
    
    return await this.bookingRepository.find({
      order: { booking_date: 'DESC', booking_time: 'ASC' },
    });
  }

  async findOne(id: string, userPhone?: string): Promise<Booking> {
    const normalizedPhone = userPhone ? normalizePhone(sanitizeText(userPhone)) : undefined;
    
    const where: any = { id };
    if (normalizedPhone) {
      where.user_phone = normalizedPhone;
    }
    
    const booking = await this.bookingRepository.findOne({ where });
    
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    
    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, userPhone?: string): Promise<Booking> {
    const existing = await this.findOne(id, userPhone);
    
    // Update fields
    Object.assign(existing, {
      ...(updateBookingDto.booking_date && { booking_date: new Date(updateBookingDto.booking_date) }),
      ...(updateBookingDto.booking_time && { booking_time: sanitizeText(updateBookingDto.booking_time) }),
      ...(updateBookingDto.full_name && { full_name: sanitizeText(updateBookingDto.full_name) }),
      ...(updateBookingDto.email && { email: sanitizeText(updateBookingDto.email) }),
      ...(updateBookingDto.phone && { phone: normalizePhone(sanitizeText(updateBookingDto.phone)) }),
      ...(updateBookingDto.special_requests !== undefined && { special_requests: updateBookingDto.special_requests ? sanitizeText(updateBookingDto.special_requests) : null }),
      ...(updateBookingDto.status && { status: updateBookingDto.status }),
      ...(updateBookingDto.amount !== undefined && { amount: updateBookingDto.amount }),
      ...(updateBookingDto.payment_status && { payment_status: updateBookingDto.payment_status as any }),
      ...(updateBookingDto.payment_id !== undefined && { payment_id: updateBookingDto.payment_id }),
      ...(updateBookingDto.notes !== undefined && { notes: updateBookingDto.notes ? sanitizeText(updateBookingDto.notes) : null }),
    });

    return await this.bookingRepository.save(existing);
  }

  async remove(id: string, userPhone?: string): Promise<void> {
    const booking = await this.findOne(id, userPhone);
    await this.bookingRepository.remove(booking);
  }

  async getUserBookings(userPhone: string): Promise<Booking[]> {
    return this.findAll(userPhone);
  }

  async getAvailableSlots(serviceId: number, date: string): Promise<string[]> {
    // Normalize date format
    let normalizedDate = date.trim();
    let dateObj: Date;

    if (/^\d{2}-\d{2}-\d{4}$/.test(normalizedDate)) {
      const [day, month, year] = normalizedDate.split('-');
      normalizedDate = `${year}-${month}-${day}`;
      dateObj = new Date(normalizedDate + 'T00:00:00.000Z');
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      dateObj = new Date(normalizedDate + 'T00:00:00.000Z');
    } else {
      dateObj = new Date(normalizedDate);
    }

    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException(`Invalid date format: ${date}. Expected YYYY-MM-DD or DD-MM-YYYY`);
    }

    normalizedDate = dateObj.toISOString().split('T')[0];

    // Use business hours to generate available slots
    const service = await this.servicesService.findOne(serviceId);
    const durationMinutes = service.duration_minutes || 60;

    const startHour = 9;
    const endHour = 18;
    const slotInterval = durationMinutes;

    const allSlots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const endMinute = minute + slotInterval;
        const endHourForSlot = hour + Math.floor(endMinute / 60);
        const endMinuteForSlot = endMinute % 60;

        if (endHourForSlot > endHour || (endHourForSlot === endHour && endMinuteForSlot > 0)) {
          break;
        }

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeString);
      }
    }

    // Filter out already booked slots
    const bookedBookings = await this.bookingRepository.find({
      where: {
        service_id: serviceId,
        booking_date: new Date(normalizedDate),
        status: Not(BookingStatus.CANCELLED),
      },
      select: ['booking_time'],
    });

    const bookedSlots = bookedBookings.map((b) => b.booking_time);
    return allSlots.filter((slot) => !bookedSlots.includes(slot)).sort();
  }

  private async findOneByUser(id: string, userPhone: string): Promise<Booking> {
    const normalizedPhone = normalizePhone(sanitizeText(userPhone));
    const booking = await this.bookingRepository.findOne({
      where: { id, user_phone: normalizedPhone },
    });
    
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}
