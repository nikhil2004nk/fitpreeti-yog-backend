import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './interfaces/service.interface';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class ServicesService {
  private readonly database: string;
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const sanitizedName = sanitizeText(createServiceDto.service_name);
      
      // Check if service name already exists using parameterized query
      const checkQuery = `SELECT id FROM ${this.database}.services WHERE service_name = {name:String} LIMIT 1`;
      const existing = await this.ch.queryParams<Array<{ id: string }>>(checkQuery, { name: sanitizedName });
      
      if (Array.isArray(existing) && existing.length > 0) {
        throw new ConflictException('Service with this name already exists');
      }

      const serviceId = require('uuid').v4();
      const now = new Date().toISOString();
      
      const serviceData = {
        id: serviceId,
        service_name: sanitizedName,
        description: sanitizeText(createServiceDto.description || ''),
        price: createServiceDto.price,
        type: sanitizeText(createServiceDto.type || ''),
        duration_minutes: createServiceDto.duration_minutes,
        trainer_id: createServiceDto.trainer_id,
        category: sanitizeText(createServiceDto.category || ''),
        image_url: createServiceDto.image_url ? sanitizeText(createServiceDto.image_url) : null,
        is_active: createServiceDto.is_active ?? true,
        created_at: now,
        updated_at: now
      };

      // Use the insert method from ClickhouseService
      await this.ch.insert('services', serviceData);
      
      // Retrieve the created service using parameterized query
      const selectQuery = `SELECT * FROM ${this.database}.services WHERE id = {id:String} LIMIT 1`;
      const result = await this.ch.queryParams<Service[]>(selectQuery, { id: serviceId });
      
      if (!Array.isArray(result) || result.length === 0) {
        throw new InternalServerErrorException('Failed to retrieve the created service');
      }
      
      return result[0];
    } catch (error) {
      this.logger.error('Create service error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create service');
    }
  }

  async findAll(type?: string): Promise<Service[]> {
    if (type) {
      const sanitizedType = sanitizeText(type);
      const query = `
        SELECT * FROM ${this.database}.services 
        WHERE type = {type:String} AND is_active = true
        ORDER BY created_at DESC
      `;
      const result = await this.ch.queryParams<Service[]>(query, { type: sanitizedType });
      return Array.isArray(result) ? result : [];
    }
    
    const query = `
      SELECT * FROM ${this.database}.services 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    const result = await this.ch.queryParams<Service[]>(query, {});
    return Array.isArray(result) ? result : [];
  }

  async findOne(id: string): Promise<Service> {
    const query = `SELECT * FROM ${this.database}.services WHERE id = {id:String} LIMIT 1`;
    const result = await this.ch.queryParams<Service[]>(query, { id });
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    
    return result[0];
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    try {
      // Check if service exists
      await this.findOne(id);
      
      // Check if new name is already taken by another service
      if (updateServiceDto.service_name) {
        const sanitizedName = sanitizeText(updateServiceDto.service_name);
        const checkQuery = `
          SELECT id FROM ${this.database}.services 
          WHERE service_name = {name:String} AND id != {id:String}
          LIMIT 1
        `;
        const existing = await this.ch.queryParams<Array<{ id: string }>>(checkQuery, { 
          name: sanitizedName, 
          id 
        });
        
        if (Array.isArray(existing) && existing.length > 0) {
          throw new ConflictException('Service name already exists');
        }
      }
      
      // Build update fields with sanitization
      const updates: string[] = [];
      const updateData: Record<string, any> = {};
      
      Object.entries(updateServiceDto).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'string') {
            updates.push(`${key} = {${key}:String}`);
            updateData[key] = sanitizeText(value);
          } else if (value === null) {
            updates.push(`${key} = NULL`);
          } else {
            updates.push(`${key} = {${key}:Any}`);
            updateData[key] = value;
          }
        }
      });
      
      if (updates.length === 0) {
        return this.findOne(id);
      }
      
      // Add updated_at
      updates.push(`updated_at = {updated_at:String}`);
      updateData.updated_at = new Date().toISOString();
      
      // Note: ClickHouse parameterized queries have limitations for ALTER TABLE UPDATE
      // So we use sanitized string concatenation for the SET clause but parameterized WHERE
      const setClause = Object.entries(updateServiceDto)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key} = '${sanitizeText(value).replace(/'/g, "''")}'`;
          } else if (value === null) {
            return `${key} = NULL`;
          } else {
            return `${key} = ${value}`;
          }
        })
        .join(', ') + `, updated_at = '${new Date().toISOString()}'`;
      
      // Execute the update query
      const updateQuery = `
        ALTER TABLE ${this.database}.services 
        UPDATE ${setClause}
        WHERE id = {id:String}
      `;
      await this.ch.queryParams(updateQuery, { id });
      
      // Wait for update to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return updated service
      return this.findOne(id);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Update service error:', error);
      throw new InternalServerErrorException('Failed to update service');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if exists
      await this.findOne(id);
      
      // Instead of deleting, deactivate the service using parameterized query
      const updateQuery = `
        ALTER TABLE ${this.database}.services 
        UPDATE is_active = false, updated_at = {updated_at:String}
        WHERE id = {id:String}
      `;
      await this.ch.queryParams(updateQuery, { 
        id, 
        updated_at: new Date().toISOString() 
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Deactivate service error:', error);
      throw new InternalServerErrorException('Failed to deactivate service');
    }
  }

  async getPopularServices(limit = 5): Promise<Service[]> {
    try {
      // Note: ClickHouse doesn't support parameterized queries well with LIMIT in all cases
      // Using sanitized limit value (should be a number)
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
      const result = await this.ch.query<Service[]>(query);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      this.logger.error('Get popular services error:', error);
      throw new InternalServerErrorException('Failed to fetch popular services');
    }
  }

  async getServicesByType(type: string): Promise<Service[]> {
    return this.findAll(type);
  }
}
