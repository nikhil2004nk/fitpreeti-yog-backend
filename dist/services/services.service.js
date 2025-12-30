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
var ServicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const clickhouse_service_1 = require("../database/clickhouse.service");
let ServicesService = ServicesService_1 = class ServicesService {
    ch;
    tableName = 'fitpreeti.services';
    logger = new common_1.Logger(ServicesService_1.name);
    constructor(ch) {
        this.ch = ch;
    }
    async create(createServiceDto) {
        try {
            const existing = await this.ch.query(`SELECT id FROM ${this.tableName} WHERE service_name = '${createServiceDto.service_name.replace(/'/g, "''")}'`);
            if (Array.isArray(existing) && existing.length > 0) {
                throw new common_1.ConflictException('Service with this name already exists');
            }
            const serviceData = {
                ...createServiceDto,
                is_active: createServiceDto.is_active ?? true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            await this.ch.insert('services', serviceData);
            const [newService] = await this.ch.query(`SELECT * FROM ${this.tableName} WHERE service_name = '${createServiceDto.service_name.replace(/'/g, "''")}' LIMIT 1`);
            if (!newService) {
                throw new common_1.InternalServerErrorException('Failed to retrieve the created service');
            }
            return newService;
        }
        catch (error) {
            this.logger.error('Create service error:', error);
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to create service');
        }
    }
    async findAll(type) {
        const whereClause = type ? `WHERE type = '${type.replace(/'/g, "''")}' AND is_active = true` : 'WHERE is_active = true';
        const result = await this.ch.query(`
      SELECT * FROM ${this.tableName} 
      ${whereClause}
      ORDER BY created_at DESC
    `);
        return Array.isArray(result) ? result : [];
    }
    async findOne(id) {
        const result = await this.ch.query(`
      SELECT * FROM ${this.tableName} WHERE id = '${id.replace(/'/g, "''")}'
    `);
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException(`Service with ID ${id} not found`);
        }
        return result[0];
    }
    async update(id, updateServiceDto) {
        try {
            await this.findOne(id);
            if (updateServiceDto.service_name) {
                const existing = await this.ch.query(`SELECT id FROM ${this.tableName} WHERE service_name = '${updateServiceDto.service_name.replace(/'/g, "''")}' AND id != '${id.replace(/'/g, "''")}'`);
                if (Array.isArray(existing) && existing.length > 0) {
                    throw new common_1.ConflictException('Service name already exists');
                }
            }
            const setClause = Object.entries(updateServiceDto)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => {
                if (typeof value === 'string') {
                    return `${key} = '${value.replace(/'/g, "''")}'`;
                }
                else if (value instanceof Date) {
                    return `${key} = '${value.toISOString()}'`;
                }
                else if (value === null) {
                    return `${key} = NULL`;
                }
                else {
                    return `${key} = ${value}`;
                }
            })
                .join(', ');
            await this.ch.query(`ALTER TABLE ${this.tableName} 
         UPDATE ${setClause}
         WHERE id = '${id.replace(/'/g, "''")}'`);
            await new Promise(resolve => setTimeout(resolve, 100));
            const maxRetries = 5;
            let retries = 0;
            let result;
            while (retries < maxRetries) {
                result = await this.ch.query(`SELECT * FROM ${this.tableName} FINAL WHERE id = '${id.replace(/'/g, "''")}'`);
                if (result && result.length > 0) {
                    const updatedService = result[0];
                    if (updateServiceDto.service_name && updatedService.service_name !== updateServiceDto.service_name) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }
                    return updatedService;
                }
                retries++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            result = await this.ch.query(`SELECT * FROM ${this.tableName} FINAL WHERE id = '${id.replace(/'/g, "''")}'`);
            if (!result || result.length === 0) {
                throw new common_1.NotFoundException(`Service with ID ${id} not found after update`);
            }
            return result[0];
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Update service error:', error);
            throw new common_1.InternalServerErrorException('Failed to update service');
        }
    }
    async remove(id) {
        try {
            await this.ch.query(`ALTER TABLE ${this.tableName} 
         UPDATE is_active = false, updated_at = '${new Date().toISOString()}'
         WHERE id = '${id.replace(/'/g, "''")}'`);
        }
        catch (error) {
            this.logger.error('Deactivate service error:', error);
            throw new common_1.InternalServerErrorException('Failed to deactivate service');
        }
    }
    async getPopularServices(limit = 5) {
        try {
            const result = await this.ch.query(`
        SELECT s.*, COUNT(b.id) as booking_count 
        FROM ${this.tableName} s
        LEFT JOIN fitpreeti.bookings b ON s.id = b.service_id
        WHERE s.is_active = true
        GROUP BY s.id, s.service_name, s.description, s.price, s.type, 
                 s.duration_minutes, s.trainer_id, s.category, s.image_url, 
                 s.is_active, s.created_at, s.updated_at
        ORDER BY booking_count DESC
        LIMIT ${limit}
      `);
            return Array.isArray(result) ? result : [];
        }
        catch (error) {
            this.logger.error('Get popular services error:', error);
            throw new common_1.InternalServerErrorException('Failed to fetch popular services');
        }
    }
    async getServicesByType(type) {
        return this.findAll(type);
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = ServicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService])
], ServicesService);
//# sourceMappingURL=services.service.js.map