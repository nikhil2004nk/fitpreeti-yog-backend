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
const uuid_1 = require("uuid");
let BookingsService = class BookingsService {
    ch;
    constructor(ch) {
        this.ch = ch;
    }
    normalizePhone(phone) {
        if (!phone)
            return '';
        const cleaned = phone.trim();
        if (cleaned.startsWith('+')) {
            return '+' + cleaned.slice(1).replace(/\D/g, '');
        }
        return cleaned.replace(/\D/g, '');
    }
    async create(createBookingDto, userPhone) {
        const normalizedPhone = this.normalizePhone(userPhone);
        const escapedPhone = this.escapeSqlString(normalizedPhone);
        const userQuery = `SELECT id FROM fitpreeti.users WHERE phone = '${escapedPhone}' LIMIT 1`;
        const userResult = await this.ch.query(userQuery);
        if (!Array.isArray(userResult) || userResult.length === 0) {
            throw new common_1.NotFoundException('User not found');
        }
        const userId = userResult[0].id;
        const escapedServiceId = this.escapeSqlString(String(createBookingDto.service_id));
        const service = await this.ch.query(`SELECT id FROM fitpreeti.services WHERE id = '${escapedServiceId}'`);
        if (!Array.isArray(service) || service.length === 0) {
            throw new common_1.NotFoundException('Service not found');
        }
        const escapedDate = this.escapeSqlString(createBookingDto.booking_date);
        const escapedTime = this.escapeSqlString(createBookingDto.booking_time);
        const conflict = await this.ch.query(`SELECT COUNT(*) as count FROM fitpreeti.bookings WHERE service_id = '${escapedServiceId}' AND booking_date = '${escapedDate}' AND booking_time = '${escapedTime}' AND status != 'cancelled'`);
        if (Array.isArray(conflict) && conflict.length > 0 && (conflict[0]?.count || 0) > 0) {
            throw new common_1.BadRequestException('Time slot already booked');
        }
        const bookingId = (0, uuid_1.v4)();
        const bookingData = {
            id: bookingId,
            user_id: userId,
            ...createBookingDto,
            user_phone: normalizedPhone,
            status: 'pending',
        };
        await this.ch.insert('bookings', bookingData);
        return this.findOneByUser(bookingId, normalizedPhone);
    }
    escapeSqlString(value) {
        return value.replace(/'/g, "''");
    }
    async findAll(userPhone) {
        const normalizedPhone = userPhone ? this.normalizePhone(userPhone) : undefined;
        const whereClause = normalizedPhone ? `WHERE user_phone = '${normalizedPhone.replace(/'/g, "''")}'` : '';
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      ${whereClause} 
      ORDER BY booking_date DESC, booking_time ASC
    `);
        return Array.isArray(result) ? result : [];
    }
    async findOne(id, userPhone) {
        const normalizedPhone = userPhone ? this.normalizePhone(userPhone) : undefined;
        const escapedId = this.escapeSqlString(id);
        const whereClause = normalizedPhone ? `AND user_phone = '${this.escapeSqlString(normalizedPhone)}'` : '';
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = '${escapedId}' ${whereClause}
    `);
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return result[0];
    }
    async update(id, updateBookingDto, userPhone) {
        const existing = await this.findOne(id, userPhone);
        const updates = [];
        Object.entries(updateBookingDto).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                updates.push(`${key} = '${this.escapeSqlString(String(value))}'`);
            }
        });
        if (updates.length === 0) {
            return existing;
        }
        const escapedId = this.escapeSqlString(id);
        await this.ch.query(`
      ALTER TABLE fitpreeti.bookings 
      UPDATE ${updates.join(', ')} 
      WHERE id = '${escapedId}'
    `);
        await new Promise(resolve => setTimeout(resolve, 100));
        const maxRetries = 5;
        let retries = 0;
        let result;
        while (retries < maxRetries) {
            const whereClause = userPhone
                ? `id = '${escapedId}' AND user_phone = '${this.escapeSqlString(this.normalizePhone(userPhone))}'`
                : `id = '${escapedId}'`;
            result = await this.ch.query(`
        SELECT * FROM fitpreeti.bookings FINAL 
        WHERE ${whereClause}
      `);
            if (result && result.length > 0) {
                const updatedBooking = result[0];
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
        const whereClause = userPhone
            ? `id = '${escapedId}' AND user_phone = '${this.escapeSqlString(this.normalizePhone(userPhone))}'`
            : `id = '${escapedId}'`;
        result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings FINAL 
      WHERE ${whereClause}
    `);
        if (!result || result.length === 0) {
            throw new common_1.NotFoundException(`Booking with ID ${id} not found after update`);
        }
        return result[0];
    }
    async remove(id, userPhone) {
        await this.findOne(id, userPhone);
        const escapedId = this.escapeSqlString(id);
        await this.ch.query(`ALTER TABLE fitpreeti.bookings DELETE WHERE id = '${escapedId}'`);
    }
    async getUserBookings(userPhone) {
        return this.findAll(userPhone);
    }
    async getAvailableSlots(serviceId, date) {
        const escapedServiceId = this.escapeSqlString(serviceId);
        const escapedDate = this.escapeSqlString(date);
        const result = await this.ch.query(`SELECT booking_time FROM fitpreeti.bookings WHERE service_id = '${escapedServiceId}' AND booking_date = '${escapedDate}' AND status != 'cancelled'`);
        if (!Array.isArray(result)) {
            return [];
        }
        return result.map((slot) => slot.booking_time);
    }
    async findOneByUser(id, userPhone) {
        const normalizedPhone = this.normalizePhone(userPhone);
        const escapedId = this.escapeSqlString(id);
        const escapedPhone = this.escapeSqlString(normalizedPhone);
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.bookings 
      WHERE id = '${escapedId}' AND user_phone = '${escapedPhone}'
    `);
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return result[0];
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map