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
const config_1 = require("@nestjs/config");
const sanitize_util_1 = require("../common/utils/sanitize.util");
let ServicesService = ServicesService_1 = class ServicesService {
    ch;
    configService;
    database;
    logger = new common_1.Logger(ServicesService_1.name);
    constructor(ch, configService) {
        this.ch = ch;
        this.configService = configService;
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    }
    async create(createServiceDto) {
        try {
            const sanitizedName = (0, sanitize_util_1.sanitizeText)(createServiceDto.service_name);
            const checkQuery = `SELECT id FROM ${this.database}.services WHERE service_name = {name:String} LIMIT 1`;
            const existing = await this.ch.queryParams(checkQuery, { name: sanitizedName });
            if (Array.isArray(existing) && existing.length > 0) {
                throw new common_1.ConflictException('Service with this name already exists');
            }
            const serviceId = require('uuid').v4();
            const now = new Date().toISOString();
            const serviceData = {
                id: serviceId,
                service_name: sanitizedName,
                description: (0, sanitize_util_1.sanitizeText)(createServiceDto.description || ''),
                price: createServiceDto.price,
                type: (0, sanitize_util_1.sanitizeText)(createServiceDto.type || ''),
                duration_minutes: createServiceDto.duration_minutes,
                trainer_id: createServiceDto.trainer_id,
                category: (0, sanitize_util_1.sanitizeText)(createServiceDto.category || ''),
                image_url: createServiceDto.image_url ? (0, sanitize_util_1.sanitizeText)(createServiceDto.image_url) : null,
                is_active: createServiceDto.is_active ?? true,
                created_at: now,
                updated_at: now
            };
            await this.ch.insert('services', serviceData);
            const selectQuery = `SELECT * FROM ${this.database}.services WHERE id = {id:String} LIMIT 1`;
            const result = await this.ch.queryParams(selectQuery, { id: serviceId });
            if (!Array.isArray(result) || result.length === 0) {
                throw new common_1.InternalServerErrorException('Failed to retrieve the created service');
            }
            return result[0];
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
        if (type) {
            const sanitizedType = (0, sanitize_util_1.sanitizeText)(type);
            const query = `
        SELECT * FROM ${this.database}.services 
        WHERE type = {type:String} AND is_active = true
        ORDER BY created_at DESC
      `;
            const result = await this.ch.queryParams(query, { type: sanitizedType });
            return Array.isArray(result) ? result : [];
        }
        const query = `
      SELECT * FROM ${this.database}.services 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
        const result = await this.ch.queryParams(query, {});
        return Array.isArray(result) ? result : [];
    }
    async findOne(id) {
        const query = `SELECT * FROM ${this.database}.services WHERE id = {id:String} LIMIT 1`;
        const result = await this.ch.queryParams(query, { id });
        if (!Array.isArray(result) || result.length === 0) {
            throw new common_1.NotFoundException(`Service with ID ${id} not found`);
        }
        return result[0];
    }
    async update(id, updateServiceDto) {
        try {
            await this.findOne(id);
            if (updateServiceDto.service_name) {
                const sanitizedName = (0, sanitize_util_1.sanitizeText)(updateServiceDto.service_name);
                const checkQuery = `
          SELECT id FROM ${this.database}.services 
          WHERE service_name = {name:String} AND id != {id:String}
          LIMIT 1
        `;
                const existing = await this.ch.queryParams(checkQuery, {
                    name: sanitizedName,
                    id
                });
                if (Array.isArray(existing) && existing.length > 0) {
                    throw new common_1.ConflictException('Service name already exists');
                }
            }
            const updates = [];
            const updateData = {};
            Object.entries(updateServiceDto).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (typeof value === 'string') {
                        updates.push(`${key} = {${key}:String}`);
                        updateData[key] = (0, sanitize_util_1.sanitizeText)(value);
                    }
                    else if (value === null) {
                        updates.push(`${key} = NULL`);
                    }
                    else {
                        updates.push(`${key} = {${key}:Any}`);
                        updateData[key] = value;
                    }
                }
            });
            if (updates.length === 0) {
                return this.findOne(id);
            }
            updates.push(`updated_at = {updated_at:String}`);
            updateData.updated_at = new Date().toISOString();
            const setClause = Object.entries(updateServiceDto)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => {
                if (typeof value === 'string') {
                    return `${key} = '${(0, sanitize_util_1.sanitizeText)(value).replace(/'/g, "''")}'`;
                }
                else if (value === null) {
                    return `${key} = NULL`;
                }
                else {
                    return `${key} = ${value}`;
                }
            })
                .join(', ') + `, updated_at = '${new Date().toISOString()}'`;
            const updateQuery = `
        ALTER TABLE ${this.database}.services 
        UPDATE ${setClause}
        WHERE id = {id:String}
      `;
            await this.ch.queryParams(updateQuery, { id });
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.findOne(id);
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
            await this.findOne(id);
            const updateQuery = `
        ALTER TABLE ${this.database}.services 
        UPDATE is_active = false, updated_at = {updated_at:String}
        WHERE id = {id:String}
      `;
            await this.ch.queryParams(updateQuery, {
                id,
                updated_at: new Date().toISOString()
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Deactivate service error:', error);
            throw new common_1.InternalServerErrorException('Failed to deactivate service');
        }
    }
    async getPopularServices(limit = 5) {
        try {
            const safeLimit = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 5));
            const query = `
        SELECT s.*, COUNT(b.id) as booking_count 
        FROM ${this.database}.services s
        LEFT JOIN ${this.database}.bookings b ON s.id = b.service_id
        WHERE s.is_active = true
        GROUP BY s.id, s.service_name, s.description, s.price, s.type, 
                 s.duration_minutes, s.trainer_id, s.category, s.image_url, 
                 s.is_active, s.created_at, s.updated_at
        ORDER BY booking_count DESC
        LIMIT ${safeLimit}
      `;
            const result = await this.ch.query(query);
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
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService,
        config_1.ConfigService])
], ServicesService);
//# sourceMappingURL=services.service.js.map