"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const clickhouse_service_1 = require("../database/clickhouse.service");
let BookingsService = class BookingsService {
    ch;
    constructor(ch) {
        this.ch = ch;
    }
    async create(createBookingDto, userPhone) {
        const service = await this.ch.query(`SELECT id FROM fitpreeti.services WHERE id = ${createBookingDto.service_id}`);
        const serviceData = await service.json();
        if (!serviceData.length) {
            throw new common_1.NotFoundException('Service not found');
        }
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
            throw new common_1.BadRequestException('Time slot already booked');
        }
        const bookingData = {
            ...createBookingDto,
            user_phone: userPhone,
            status: 'pending',
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
    async findAll(userPhone) {
        const whereClause = userPhone ? `WHERE user_phone = '${userPhone}'` : '';
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      ${whereClause} 
      ORDER BY booking_date DESC, booking_time ASC
    `);
        return await result.json();
    }
    async findOne(id, userPhone) {
        const whereClause = userPhone ? `AND user_phone = '${userPhone}'` : '';
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = ${id} ${whereClause}
    `);
        const data = await result.json();
        if (!data.length) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return data[0];
    }
    async update(id, updateBookingDto, userPhone) {
        const existing = await this.findOne(id, userPhone);
        const updates = [];
        Object.entries(updateBookingDto).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                updates.push(`${key} = '${value}'`);
            }
        });
        if (updates.length === 0) {
            return existing;
        }
        await this.ch.query(`
      ALTER TABLE fitpreeti.bookings 
      UPDATE ${updates.join(', ')} 
      WHERE id = ${id}
    `);
        return this.findOne(id, userPhone);
    }
    async remove(id, userPhone) {
        await this.findOne(id, userPhone);
        await this.ch.query(`ALTER TABLE fitpreeti.bookings DELETE WHERE id = ${id}`);
    }
    async getUserBookings(userPhone) {
        return this.findAll(userPhone);
    }
    async getAvailableSlots(serviceId, date) {
        const result = await this.ch.query(`
      SELECT booking_time 
      FROM fitpreeti.bookings 
      WHERE service_id = ${serviceId} 
      AND booking_date = '${date}'
      AND status != 'cancelled'
    `);
        const bookedSlots = await result.json();
        return bookedSlots.map((slot) => slot.booking_time);
    }
    async findOneByUser(id, userPhone) {
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = ${id} AND user_phone = '${userPhone}'
    `);
        const data = await result.json();
        if (!data.length) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return data[0];
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map