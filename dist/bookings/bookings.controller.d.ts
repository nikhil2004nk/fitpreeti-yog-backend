import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { Request } from 'express';
import type { RequestUser } from '../common/interfaces/request-user.interface';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(createBookingDto: CreateBookingDto, req: Request & {
        user: RequestUser;
    }): Promise<import("./interfaces/booking.interface").Booking>;
    findAll(req: Request & {
        user: RequestUser;
    }): Promise<import("./interfaces/booking.interface").Booking[]>;
    findOne(id: string, req: Request & {
        user: RequestUser;
    }): Promise<import("./interfaces/booking.interface").Booking>;
    update(id: string, updateBookingDto: UpdateBookingDto): Promise<import("./interfaces/booking.interface").Booking>;
    remove(id: string, req: Request & {
        user: RequestUser;
    }): Promise<void>;
    getAvailableSlots(serviceId: string, date: string): Promise<string[]>;
    findAllAdmin(): Promise<import("./interfaces/booking.interface").Booking[]>;
}
