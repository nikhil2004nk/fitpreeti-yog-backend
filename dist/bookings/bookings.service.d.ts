import { ClickhouseService } from '../database/clickhouse.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './interfaces/booking.interface';
export declare class BookingsService {
    private ch;
    constructor(ch: ClickhouseService);
    create(createBookingDto: CreateBookingDto, userPhone: string): Promise<Booking>;
    findAll(userPhone?: string): Promise<Booking[]>;
    findOne(id: number, userPhone?: string): Promise<Booking>;
    update(id: number, updateBookingDto: UpdateBookingDto, userPhone?: string): Promise<Booking>;
    remove(id: number, userPhone?: string): Promise<void>;
    getUserBookings(userPhone: string): Promise<Booking[]>;
    getAvailableSlots(serviceId: number, date: string): Promise<string[]>;
    private findOneByUser;
}
