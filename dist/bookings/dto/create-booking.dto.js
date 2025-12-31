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
exports.CreateBookingDto = exports.BookingStatus = void 0;
const class_validator_1 = require("class-validator");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
class CreateBookingDto {
    service_id;
    booking_date;
    booking_time;
    full_name;
    email;
    phone;
    special_requests;
    amount;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "service_id", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "booking_date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "booking_time", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "full_name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "special_requests", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "amount", void 0);
//# sourceMappingURL=create-booking.dto.js.map