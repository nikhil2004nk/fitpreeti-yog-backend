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
    const existing = await this.ch.query(`
      SELECT id FROM fitpreeti.services 
      WHERE service_name = '${createServiceDto.service_name}'
    `);
    const existingData = await existing.json();
    
    if (existingData.length > 0) {
      throw new ConflictException('Service name already exists');
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

  async findAll(type?: string): Promise<Service[]> {
    const whereClause = type ? `WHERE service_type = '${type}'` : '';
    const result = await this.ch.query(`
      SELECT * FROM fitpreeti.services 
      ${whereClause}
      ORDER BY created_at DESC
    `);
    return await result.json();
  }

  async findOne(id: number): Promise<Service> {
    const result = await this.ch.query(`
      SELECT * FROM fitpreeti.services 
      WHERE id = ${id}
    `);
    const data = await result.json();
    
    if (!data.length) {
      throw new NotFoundException('Service not found');
    }
    return data[0];
  }

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const existing = await this.findOne(id);
    
    const updates: string[] = [];
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

  async remove(id: number): Promise<void> {
    // Check if service has bookings
    const bookings = await this.ch.query(`
      SELECT COUNT(*) as count 
      FROM fitpreeti.bookings 
      WHERE service_id = ${id} AND status != 'cancelled'
    `);
    const bookingData = await bookings.json();
    
    if (bookingData[0]?.count > 0) {
      throw new ConflictException('Cannot delete service with active bookings');
    }

    await this.ch.query(`ALTER TABLE fitpreeti.services DELETE WHERE id = ${id}`);
  }

  async getServicesByType(type: string): Promise<Service[]> {
    return this.findAll(type);
  }

  async getPopularServices(): Promise<Service[]> {
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
}
