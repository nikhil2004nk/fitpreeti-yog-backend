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
const phone_util_1 = require("../common/utils/phone.util");
const sanitize_util_1 = require("../common/utils/sanitize.util");
const config_1 = require("@nestjs/config");
let BookingsService = class BookingsService {
    ch;
    configService;
    database;
    constructor(ch, configService) {
        this.ch = ch;
        this.configService = configService;
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    }
    async create(createBookingDto, userPhone) {
        const normalizedPhone = (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(userPhone));
        const userQuery = `SELECT id FROM ${this.database}.users WHERE phone = {phone:String} LIMIT 1`;
        const userResult = await this.ch.queryParams(userQuery, { phone: normalizedPhone });
        if (!Array.isArray(userResult) || userResult.length === 0) {
            throw new common_1.NotFoundException('User not found');
        }
        const userId = userResult[0].id;
        const serviceQuery = `SELECT id FROM ${this.database}.services WHERE id = {serviceId:String} LIMIT 1`;
        const service = await this.ch.queryParams(serviceQuery, {
            serviceId: String(createBookingDto.service_id)
        });
        if (!Array.isArray(service) || service.length === 0) {
            throw new common_1.NotFoundException('Service not found');
        }
        const conflictQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.database}.bookings 
      WHERE service_id = {serviceId:String} 
        AND booking_date = {date:String} 
        AND booking_time = {time:String} 
        AND status != 'cancelled'
    `;
        const conflict = await this.ch.queryParams(conflictQuery, {
            serviceId: String(createBookingDto.service_id),
            date: (0, sanitize_util_1.sanitizeText)(createBookingDto.booking_date),
            time: (0, sanitize_util_1.sanitizeText)(createBookingDto.booking_time),
        });
        if (Array.isArray(conflict) && conflict.length > 0 && (conflict[0]?.count || 0) > 0) {
            throw new common_1.BadRequestException('Time slot already booked');
        }
        const bookingId = (0, uuid_1.v4)();
        const bookingData = {
            id: bookingId,
            user_id: userId,
            service_id: createBookingDto.service_id,
            booking_date: (0, sanitize_util_1.sanitizeText)(createBookingDto.booking_date),
            booking_time: (0, sanitize_util_1.sanitizeText)(createBookingDto.booking_time),
            user_phone: normalizedPhone,
            status: 'pending',
        };
        await this.ch.insert('bookings', bookingData);
        return this.findOneByUser(bookingId, normalizedPhone);
    }
    async findAll(userPhone) {
        const normalizedPhone = userPhone ? (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(userPhone)) : undefined;
        if (normalizedPhone) {
            const query = `
        SELECT * FROM ${this.database}.bookings 
        WHERE user_phone = {phone:String}
        ORDER BY booking_date DESC, booking_time ASC
      `;
            const result = await this.ch.queryParams(query, { phone: normalizedPhone });
            return Array.isArray(result) ? result : [];
        }
        const query = `
      SELECT * FROM ${this.database}.bookings 
      ORDER BY booking_date DESC, booking_time ASC
    `;
        const result = await this.ch.queryParams(query, {});
        return Array.isArray(result) ? result : [];
    }
    async findOne(id, userPhone) {
        const normalizedPhone = userPhone ? (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(userPhone)) : undefined;
        if (normalizedPhone) {
            const query = `
        SELECT * FROM ${this.database}.bookings 
        WHERE id = {id:String} AND user_phone = {phone:String}
        LIMIT 1
      `;
            const result = await this.ch.queryParams(query, { id, phone: normalizedPhone });
            if (!Array.isArray(result) || result.length === 0) {
                throw new common_1.NotFoundException('Booking not found');
            }
            return result[0];
        }
        const query = `
      SELECT * FROM ${this.database}.bookings 
      WHERE id = {id:String}
      LIMIT 1
    `;
        const result = await this.ch.queryParams(query, { id });
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return result[0];
    }
    async update(id, updateBookingDto, userPhone) {
        const existing = await this.findOne(id, userPhone);
        const sanitizedUpdates = {};
        Object.entries(updateBookingDto).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                sanitizedUpdates[key] = typeof value === 'string' ? (0, sanitize_util_1.sanitizeText)(value) : value;
            }
        });
        if (Object.keys(sanitizedUpdates).length === 0) {
            return existing;
        }
        const updates = Object.entries(sanitizedUpdates)
            .map(([key, value]) => `${key} = '${String(value).replace(/'/g, "''")}'`)
            .join(', ');
        const updateQuery = `
      ALTER TABLE ${this.database}.bookings 
      UPDATE ${updates} 
      WHERE id = {id:String}
    `;
        await this.ch.queryParams(updateQuery, { id });
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.findOne(id, userPhone);
    }
    async remove(id, userPhone) {
        await this.findOne(id, userPhone);
        const deleteQuery = `ALTER TABLE ${this.database}.bookings DELETE WHERE id = {id:String}`;
        await this.ch.queryParams(deleteQuery, { id });
    }
    async getUserBookings(userPhone) {
        return this.findAll(userPhone);
    }
    async getAvailableSlots(serviceId, date) {
        const query = `
      SELECT booking_time 
      FROM ${this.database}.bookings 
      WHERE service_id = {serviceId:String} 
        AND booking_date = {date:String} 
        AND status != 'cancelled'
    `;
        const result = await this.ch.queryParams(query, {
            serviceId: (0, sanitize_util_1.sanitizeText)(serviceId),
            date: (0, sanitize_util_1.sanitizeText)(date),
        });
        if (!Array.isArray(result)) {
            return [];
        }
        return result.map((slot) => slot.booking_time);
    }
    async findOneByUser(id, userPhone) {
        const normalizedPhone = (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(userPhone));
        const query = `
      SELECT * FROM ${this.database}.bookings 
      WHERE id = {id:String} AND user_phone = {phone:String}
      LIMIT 1
    `;
        const result = await this.ch.queryParams(query, { id, phone: normalizedPhone });
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return result[0];
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService,
        config_1.ConfigService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map