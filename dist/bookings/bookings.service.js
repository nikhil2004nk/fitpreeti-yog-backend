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
const services_service_1 = require("../services/services.service");
const class_schedule_service_1 = require("../class-schedule/class-schedule.service");
const class_schedule_entity_1 = require("../class-schedule/entities/class-schedule.entity");
let BookingsService = class BookingsService {
    ch;
    configService;
    servicesService;
    classScheduleService;
    database;
    constructor(ch, configService, servicesService, classScheduleService) {
        this.ch = ch;
        this.configService = configService;
        this.servicesService = servicesService;
        this.classScheduleService = classScheduleService;
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
        const serviceQuery = `SELECT id, price FROM ${this.database}.services WHERE id = {serviceId:String} LIMIT 1`;
        const service = await this.ch.queryParams(serviceQuery, {
            serviceId: String(createBookingDto.service_id)
        });
        if (!Array.isArray(service) || service.length === 0) {
            throw new common_1.NotFoundException('Service not found');
        }
        const servicePrice = service[0].price;
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
        const bookingAmount = createBookingDto.amount !== undefined ? createBookingDto.amount : servicePrice;
        const bookingData = {
            id: bookingId,
            user_id: userId,
            service_id: createBookingDto.service_id,
            booking_date: (0, sanitize_util_1.sanitizeText)(createBookingDto.booking_date),
            booking_time: (0, sanitize_util_1.sanitizeText)(createBookingDto.booking_time),
            user_phone: normalizedPhone,
            full_name: (0, sanitize_util_1.sanitizeText)(createBookingDto.full_name),
            email: (0, sanitize_util_1.sanitizeText)(createBookingDto.email),
            phone: (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(createBookingDto.phone)),
            special_requests: createBookingDto.special_requests ? (0, sanitize_util_1.sanitizeText)(createBookingDto.special_requests) : null,
            amount: bookingAmount,
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
        let normalizedDate = date.trim();
        let dateObj;
        if (/^\d{2}-\d{2}-\d{4}$/.test(normalizedDate)) {
            const [day, month, year] = normalizedDate.split('-');
            normalizedDate = `${year}-${month}-${day}`;
            dateObj = new Date(normalizedDate + 'T00:00:00.000Z');
        }
        else if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
            dateObj = new Date(normalizedDate + 'T00:00:00.000Z');
        }
        else {
            dateObj = new Date(normalizedDate);
        }
        if (isNaN(dateObj.getTime())) {
            throw new common_1.BadRequestException(`Invalid date format: ${date}. Expected YYYY-MM-DD or DD-MM-YYYY`);
        }
        normalizedDate = dateObj.toISOString().split('T')[0];
        const allSchedules = await this.classScheduleService.findAll({
            service_id: serviceId,
        });
        const classSchedules = allSchedules.filter(schedule => {
            if (schedule.status !== class_schedule_entity_1.ClassStatus.SCHEDULED || schedule.current_participants >= schedule.max_participants) {
                return false;
            }
            const scheduleStart = new Date(schedule.start_time);
            const scheduleDate = scheduleStart.toISOString().split('T')[0];
            const requestedDate = new Date(normalizedDate + 'T00:00:00.000Z');
            const startDate = new Date(schedule.start_time);
            const startDateOnly = startDate.toISOString().split('T')[0];
            if (schedule.is_recurring && schedule.recurrence_pattern) {
                if (schedule.recurrence_end_date) {
                    const endDate = new Date(schedule.recurrence_end_date);
                    const endDateOnly = endDate.toISOString().split('T')[0];
                    if (normalizedDate < startDateOnly || normalizedDate > endDateOnly) {
                        return false;
                    }
                }
                else {
                    if (normalizedDate < startDateOnly) {
                        return false;
                    }
                }
                if (schedule.recurrence_pattern.toLowerCase() === 'daily') {
                    return true;
                }
                else if (schedule.recurrence_pattern.toLowerCase() === 'weekly') {
                    const startDayOfWeek = startDate.getUTCDay();
                    const requestedDayOfWeek = requestedDate.getUTCDay();
                    return startDayOfWeek === requestedDayOfWeek;
                }
                else if (schedule.recurrence_pattern.toLowerCase() === 'monthly') {
                    return startDate.getUTCDate() === requestedDate.getUTCDate();
                }
            }
            return scheduleDate === normalizedDate;
        });
        const availableSlots = [];
        for (const schedule of classSchedules) {
            const startTime = new Date(schedule.start_time);
            const isoString = startTime.toISOString();
            const timeMatch = isoString.match(/T(\d{2}):(\d{2})/);
            let hours;
            let minutes;
            if (timeMatch) {
                hours = parseInt(timeMatch[1], 10);
                minutes = parseInt(timeMatch[2], 10);
            }
            else {
                hours = startTime.getUTCHours();
                minutes = startTime.getUTCMinutes();
            }
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            const bookedQuery = `
        SELECT COUNT(*) as count
        FROM ${this.database}.bookings 
        WHERE service_id = {serviceId:String} 
          AND booking_date = {date:String} 
          AND booking_time = {time:String}
          AND status != 'cancelled'
      `;
            const bookedResult = await this.ch.queryParams(bookedQuery, {
                serviceId: (0, sanitize_util_1.sanitizeText)(serviceId),
                date: (0, sanitize_util_1.sanitizeText)(normalizedDate),
                time: timeString,
            });
            const isBooked = Array.isArray(bookedResult) && bookedResult.length > 0 && (bookedResult[0]?.count || 0) > 0;
            if (!isBooked && !availableSlots.includes(timeString)) {
                availableSlots.push(timeString);
            }
        }
        if (availableSlots.length === 0) {
            const service = await this.servicesService.findOne(serviceId);
            const durationMinutes = service.duration_minutes || 60;
            const startHour = 9;
            const endHour = 18;
            const slotInterval = durationMinutes;
            const allSlots = [];
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
            const bookedQuery = `
        SELECT booking_time 
        FROM ${this.database}.bookings 
        WHERE service_id = {serviceId:String} 
          AND booking_date = {date:String} 
          AND status != 'cancelled'
      `;
            const bookedResult = await this.ch.queryParams(bookedQuery, {
                serviceId: (0, sanitize_util_1.sanitizeText)(serviceId),
                date: (0, sanitize_util_1.sanitizeText)(normalizedDate),
            });
            const bookedSlots = Array.isArray(bookedResult)
                ? bookedResult.map((slot) => slot.booking_time)
                : [];
            return allSlots.filter(slot => !bookedSlots.includes(slot));
        }
        return availableSlots.sort();
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
        config_1.ConfigService,
        services_service_1.ServicesService,
        class_schedule_service_1.ClassScheduleService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map