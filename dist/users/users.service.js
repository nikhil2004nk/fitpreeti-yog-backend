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
const config_1 = require("@nestjs/config");
const phone_util_1 = require("../common/utils/phone.util");
const sanitize_util_1 = require("../common/utils/sanitize.util");
let UsersService = class UsersService {
    ch;
    configService;
    database;
    constructor(ch, configService) {
        this.ch = ch;
        this.configService = configService;
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    }
    async findAll() {
        const query = `SELECT 
      id, 
      name, 
      email, 
      phone, 
      role, 
      profile_image, 
      is_active, 
      last_login, 
      created_at, 
      updated_at 
    FROM ${this.database}.users 
    ORDER BY created_at DESC`;
        const result = await this.ch.queryParams(query, {});
        return Array.isArray(result) ? result : [];
    }
    async findOne(phone) {
        const normalizedPhone = (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(phone));
        const query = `
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        role, 
        profile_image, 
        is_active, 
        last_login, 
        created_at, 
        updated_at 
      FROM ${this.database}.users 
      WHERE phone = {phone:String}
      LIMIT 1
    `;
        const result = await this.ch.queryParams(query, {
            phone: normalizedPhone
        });
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException('User not found');
        }
        return result[0];
    }
    async updateRole(phone, role) {
        const normalizedPhone = (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(phone));
        const sanitizedRole = (0, sanitize_util_1.sanitizeText)(role);
        const updateQuery = `
      ALTER TABLE ${this.database}.users 
      UPDATE role = {role:String} 
      WHERE phone = {phone:String}
    `;
        await this.ch.queryParams(updateQuery, { role: sanitizedRole, phone: normalizedPhone });
        return this.findOne(normalizedPhone);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map