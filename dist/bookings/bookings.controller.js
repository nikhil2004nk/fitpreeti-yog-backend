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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const update_booking_dto_1 = require("./dto/update-booking.dto");
const cookie_jwt_guard_1 = require("../auth/guards/cookie-jwt.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    create(createBookingDto, req) {
        return this.bookingsService.create(createBookingDto, req.user.phone);
    }
    findAll(req) {
        return this.bookingsService.getUserBookings(req.user.phone);
    }
    findOne(id, req) {
        return this.bookingsService.findOne(id, req.user.phone);
    }
    update(id, updateBookingDto) {
        return this.bookingsService.update(id, updateBookingDto);
    }
    remove(id, req) {
        return this.bookingsService.remove(id, req.user.phone);
    }
    async getAvailableSlots(serviceId, date) {
        return this.bookingsService.getAvailableSlots(serviceId, date);
    }
    findAllAdmin() {
        return this.bookingsService.findAll();
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking' }),
    (0, swagger_1.ApiBody)({ type: create_booking_dto_1.CreateBookingDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Booking created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid data or time slot already booked' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or service not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user bookings' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a booking by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Booking UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the booking' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'trainer'),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a booking (Admin or Trainer)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Booking UUID' }),
    (0, swagger_1.ApiBody)({ type: update_booking_dto_1.UpdateBookingDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin or Trainer access required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_booking_dto_1.UpdateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel/delete a booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Booking UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Booking deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('available/:serviceId/:date'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available time slots for a service on a specific date' }),
    (0, swagger_1.ApiParam)({ name: 'serviceId', type: String, description: 'Service UUID' }),
    (0, swagger_1.ApiParam)({ name: 'date', type: String, description: 'Date in YYYY-MM-DD format' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns available time slots' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('serviceId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getAvailableSlots", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'trainer'),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings (Admin or Trainer)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all bookings' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin or Trainer access required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findAllAdmin", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map