import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './interfaces/service.interface';

@Injectable()
export class ServicesService {
  constructor(private ch: ClickhouseService) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // Check if service name already exists
    const existing = await this.ch.query<Array<{ id: string }>>(
      `SELECT id FROM fitpreeti.services WHERE service_name = '${createServiceDto.service_name.replace(/'/g, "''")}'`
    );
    
    if (Array.isArray(existing) && existing.length > 0) {
      throw new ConflictException('Service name already exists');
    }

    const serviceData = {
      ...createServiceDto,
    };

    await this.ch.insert('services', serviceData);
    
    const newService = await this.ch.query<Array<{ id: string }>>(
      `SELECT id FROM fitpreeti.services WHERE service_name = '${createServiceDto.service_name.replace(/'/g, "''")}' LIMIT 1`
    );
    
    const serviceId = Array.isArray(newService) && newService.length > 0 ? newService[0].id : '';
    if (!serviceId) {
      throw new NotFoundException('Service was created but could not be retrieved');
    }
    return this.findOne(serviceId);
  }

  async findAll(type?: string): Promise<Service[]> {
    const whereClause = type ? `WHERE service_type = '${type.replace(/'/g, "''")}'` : '';
    const result = await this.ch.query<Service[]>(`
      SELECT * FROM fitpreeti.services 
      ${whereClause}
      ORDER BY created_at DESC
    `);
    return Array.isArray(result) ? result : [];
  }

  async findOne(id: string): Promise<Service> {
    // UUID must be quoted as a string
    const escapedId = id.replace(/'/g, "''");
    const result = await this.ch.query<Service[]>(
      `SELECT * FROM fitpreeti.services WHERE id = '${escapedId}'`
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Service not found');
    }
    return result[0];
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const existing = await this.findOne(id);
    
    const updates: string[] = [];
    Object.entries(updateServiceDto).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const escapedValue = String(value).replace(/'/g, "''");
        updates.push(`${key} = '${escapedValue}'`);
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    // UUID must be quoted as a string
    const escapedId = id.replace(/'/g, "''");
    await this.ch.query(
      `ALTER TABLE fitpreeti.services UPDATE ${updates.join(', ')} WHERE id = '${escapedId}'`
    );

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // UUID must be quoted as a string
    const escapedId = id.replace(/'/g, "''");
    
    // Check if service has bookings - service_id is now UUID
    // First get the service to verify it exists
    await this.findOne(id);
    
    // Check for active bookings with this service
    const bookings = await this.ch.query<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM fitpreeti.bookings WHERE service_id = '${escapedId}' AND status != 'cancelled'`
    );
    
    if (Array.isArray(bookings) && bookings.length > 0 && bookings[0]?.count > 0) {
      throw new ConflictException('Cannot delete service with active bookings');
    }
    
    await this.ch.query(`ALTER TABLE fitpreeti.services DELETE WHERE id = '${escapedId}'`);
  }

  async getServicesByType(type: string): Promise<Service[]> {
    return this.findAll(type);
  }

  async getPopularServices(): Promise<Service[]> {
    // service_id is now UUID, so the JOIN should work correctly
    const result = await this.ch.query<Service[]>(
      `SELECT s.*, COUNT(b.id) as booking_count FROM fitpreeti.services s LEFT JOIN fitpreeti.bookings b ON s.id = b.service_id AND b.status != 'cancelled' GROUP BY s.id, s.service_type, s.service_name, s.description, s.price, s.duration, s.created_at ORDER BY booking_count DESC LIMIT 5`
    );
    return Array.isArray(result) ? result : [];
  }
}
