import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './interfaces/service.interface';

@Injectable()
export class ServicesService {
  private readonly tableName = 'fitpreeti.services';
  private readonly logger = new Logger(ServicesService.name);

  constructor(private ch: ClickhouseService) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      // Check if service name already exists
      const existing = await this.ch.query<Array<{ id: string }>>(
        `SELECT id FROM ${this.tableName} WHERE service_name = '${createServiceDto.service_name.replace(/'/g, "''")}'`
      );
      
      if (Array.isArray(existing) && existing.length > 0) {
        throw new ConflictException('Service with this name already exists');
      }

      const serviceData = {
        ...createServiceDto,
        is_active: createServiceDto.is_active ?? true, // Default to true if not provided
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Use the insert method from ClickhouseService
      await this.ch.insert('services', serviceData);
      
      const [newService] = await this.ch.query<Service[]>(
        `SELECT * FROM ${this.tableName} WHERE service_name = '${createServiceDto.service_name.replace(/'/g, "''")}' LIMIT 1`
      );
      
      if (!newService) {
        throw new InternalServerErrorException('Failed to retrieve the created service');
      }
      
      return newService;
    } catch (error) {
      this.logger.error('Create service error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create service');
    }
  }

  async findAll(type?: string): Promise<Service[]> {
    const whereClause = type ? `WHERE type = '${type.replace(/'/g, "''")}' AND is_active = true` : 'WHERE is_active = true';
    const result = await this.ch.query<Service[]>(`
      SELECT * FROM ${this.tableName} 
      ${whereClause}
      ORDER BY created_at DESC
    `);
    return Array.isArray(result) ? result : [];
  }

  async findOne(id: string): Promise<Service> {
    const result = await this.ch.query<Service[]>(`
      SELECT * FROM ${this.tableName} WHERE id = '${id.replace(/'/g, "''")}'
    `);
    
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
        const existing = await this.ch.query<Array<{ id: string }>>(
          `SELECT id FROM ${this.tableName} WHERE service_name = '${updateServiceDto.service_name.replace(/'/g, "''")}' AND id != '${id.replace(/'/g, "''")}'`
        );
        
        if (Array.isArray(existing) && existing.length > 0) {
          throw new ConflictException('Service name already exists');
        }
      }
      
      // Build SET clause for the update
      const setClause = Object.entries(updateServiceDto)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key} = '${value.replace(/'/g, "''")}'`;
          } else if (value instanceof Date) {
            return `${key} = '${value.toISOString()}'`;
          } else if (value === null) {
            return `${key} = NULL`;
          } else {
            return `${key} = ${value}`;
          }
        })
        .join(', ');
      
      // Execute the update query
      await this.ch.query(
        `ALTER TABLE ${this.tableName} 
         UPDATE ${setClause}
         WHERE id = '${id.replace(/'/g, "''")}'`
      );
      
      // Add a small delay to ensure the update is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Retry mechanism to get the updated record
      const maxRetries = 5;
      let retries = 0;
      let result;
      
      while (retries < maxRetries) {
        result = await this.ch.query<Service[]>(`SELECT * FROM ${this.tableName} FINAL WHERE id = '${id.replace(/'/g, "''")}'`);
        
        if (result && result.length > 0) {
          const updatedService = result[0];
          // Verify if the record was actually updated by checking one of the updated fields
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
      
      // If we got here, we couldn't verify the update after retries
      // Return the record anyway, even if we can't verify the update
      result = await this.ch.query<Service[]>(`SELECT * FROM ${this.tableName} FINAL WHERE id = '${id.replace(/'/g, "''")}'`);
      if (!result || result.length === 0) {
        throw new NotFoundException(`Service with ID ${id} not found after update`);
      }
      
      return result[0];
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
      // Instead of deleting, we'll deactivate the service
      await this.ch.query(
        `ALTER TABLE ${this.tableName} 
         UPDATE is_active = false, updated_at = '${new Date().toISOString()}'
         WHERE id = '${id.replace(/'/g, "''")}'`
      );
    } catch (error) {
      this.logger.error('Deactivate service error:', error);
      throw new InternalServerErrorException('Failed to deactivate service');
    }
  }

  async getPopularServices(limit = 5): Promise<Service[]> {
    try {
      const result = await this.ch.query<Service[]>(`
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
    } catch (error) {
      this.logger.error('Get popular services error:', error);
      throw new InternalServerErrorException('Failed to fetch popular services');
    }
  }

  async getServicesByType(type: string): Promise<Service[]> {
    return this.findAll(type);
  }
}
