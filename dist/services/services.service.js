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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const clickhouse_service_1 = require("../database/clickhouse.service");
let ServicesService = class ServicesService {
    ch;
    constructor(ch) {
        this.ch = ch;
    }
    async create(createServiceDto) {
        const existing = await this.ch.query(`
      SELECT id FROM fitpreeti.services 
      WHERE service_name = '${createServiceDto.service_name}'
    `);
        const existingData = await existing.json();
        if (existingData.length > 0) {
            throw new common_1.ConflictException('Service name already exists');
        }
        const serviceData = {
            ...createServiceDto,
        };
        await this.ch.insert('services', serviceData);
        return this.findOne((await this.ch.query(`
      SELECT id FROM fitpreeti.services 
      WHERE service_name = '${createServiceDto.service_name}' LIMIT 1
    `)).json()[0]?.id || 0);
    }
    async findAll(type) {
        const whereClause = type ? `WHERE service_type = '${type}'` : '';
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.services 
      ${whereClause}
      ORDER BY created_at DESC
    `);
        return await result.json();
    }
    async findOne(id) {
        const result = await this.ch.query(`
      SELECT * FROM fitpreeti.services 
      WHERE id = ${id}
    `);
        const data = await result.json();
        if (!data.length) {
            throw new common_1.NotFoundException('Service not found');
        }
        return data[0];
    }
    async update(id, updateServiceDto) {
        const existing = await this.findOne(id);
        const updates = [];
        Object.entries(updateServiceDto).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                updates.push(`${key} = '${value}'`);
            }
        });
        if (updates.length === 0) {
            return existing;
        }
        await this.ch.query(`
      ALTER TABLE fitpreeti.services 
      UPDATE ${updates.join(', ')} 
      WHERE id = ${id}
    `);
        return this.findOne(id);
    }
    async remove(id) {
        const bookings = await this.ch.query(`
      SELECT COUNT(*) as count 
      FROM fitpreeti.bookings 
      WHERE service_id = ${id} AND status != 'cancelled'
    `);
        const bookingData = await bookings.json();
        if (bookingData[0]?.count > 0) {
            throw new common_1.ConflictException('Cannot delete service with active bookings');
        }
        await this.ch.query(`ALTER TABLE fitpreeti.services DELETE WHERE id = ${id}`);
    }
    async getServicesByType(type) {
        return this.findAll(type);
    }
    async getPopularServices() {
        const result = await this.ch.query(`
      SELECT 
        s.*,
        COUNT(b.id) as booking_count
      FROM fitpreeti.services s
      LEFT JOIN fitpreeti.bookings b ON s.id = b.service_id AND b.status != 'cancelled'
      GROUP BY s.id, s.service_type, s.service_name, s.description, s.price, s.duration, s.created_at
      ORDER BY booking_count DESC
      LIMIT 5
    `);
        return await result.json();
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService])
], ServicesService);
//# sourceMappingURL=services.service.js.map