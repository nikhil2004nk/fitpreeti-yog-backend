import { ClickhouseService } from '../database/clickhouse.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './interfaces/booking.interface';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../services/services.service';
import { ClassScheduleService } from '../class-schedule/class-schedule.service';
export declare class BookingsService {
    private ch;
    private configService;
    private servicesService;
    private classScheduleService;
    private readonly database;
    constructor(ch: ClickhouseService, configService: ConfigService, servicesService: ServicesService, classScheduleService: ClassScheduleService);
    create(createBookingDto: CreateBookingDto, userPhone: string): Promise<Booking>;
    findAll(userPhone?: string): Promise<Booking[]>;
    findOne(id: string, userPhone?: string): Promise<Booking>;
    update(id: string, updateBookingDto: UpdateBookingDto, userPhone?: string): Promise<Booking>;
    remove(id: string, userPhone?: string): Promise<void>;
    getUserBookings(userPhone: string): Promise<Booking[]>;
    getAvailableSlots(serviceId: string, date: string): Promise<string[]>;
    private findOneByUser;
}
