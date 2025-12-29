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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const clickhouse_service_1 = require("../database/clickhouse.service");
let UsersService = class UsersService {
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
    async findAll() {
        const result = await this.ch.query('SELECT id, phone, role, created_at FROM fitpreeti.users ORDER BY created_at DESC');
        return Array.isArray(result) ? result : [];
    }
    async findOne(phone) {
        const normalizedPhone = this.normalizePhone(phone);
        const escapedPhone = normalizedPhone.replace(/'/g, "''");
        const result = await this.ch.query(`SELECT id, phone, role, created_at FROM fitpreeti.users WHERE phone = '${escapedPhone}'`);
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException('User not found');
        }
        return result[0];
    }
    async updateRole(phone, role) {
        const normalizedPhone = this.normalizePhone(phone);
        await this.ch.query(`ALTER TABLE fitpreeti.users UPDATE role = '${role.replace(/'/g, "''")}' WHERE phone = '${normalizedPhone.replace(/'/g, "''")}'`);
        return this.findOne(normalizedPhone);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService])
], UsersService);
//# sourceMappingURL=users.service.js.map