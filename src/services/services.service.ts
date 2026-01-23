import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const sanitizedName = sanitizeText(createServiceDto.service_name);
      
      // Check if service name already exists
      const existing = await this.serviceRepository.findOne({
        where: { service_name: sanitizedName },
      });
      
      if (existing) {
        throw new ConflictException('Service with this name already exists');
      }

      const service = this.serviceRepository.create({
        service_name: sanitizedName,
        description: sanitizeText(createServiceDto.description || ''),
        price: createServiceDto.price,
        type: createServiceDto.type as any,
        duration_minutes: createServiceDto.duration_minutes,
        trainer_id: createServiceDto.trainer_id,
        category: createServiceDto.category ? sanitizeText(createServiceDto.category) : null,
        image_url: createServiceDto.image_url ? sanitizeText(createServiceDto.image_url) : null,
        is_active: createServiceDto.is_active ?? true,
      });

      return await this.serviceRepository.save(service);
    } catch (error) {
      this.logger.error('Create service error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create service');
    }
  }

  async findAll(type?: string): Promise<Service[]> {
    const where: any = { is_active: true };
    if (type) {
      where.type = sanitizeText(type);
    }
    
    return await this.serviceRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    try {
      const service = await this.findOne(id);
      
      // Check if new name is already taken by another service
      if (updateServiceDto.service_name) {
        const sanitizedName = sanitizeText(updateServiceDto.service_name);
        const existing = await this.serviceRepository.findOne({
          where: { service_name: sanitizedName },
        });
        
        if (existing && existing.id !== id) {
          throw new ConflictException('Service name already exists');
        }
      }
      
      // Update fields
      Object.assign(service, {
        ...(updateServiceDto.service_name && { service_name: sanitizeText(updateServiceDto.service_name) }),
        ...(updateServiceDto.description !== undefined && { description: sanitizeText(updateServiceDto.description || '') }),
        ...(updateServiceDto.price !== undefined && { price: updateServiceDto.price }),
        ...(updateServiceDto.type !== undefined && { type: updateServiceDto.type as any }),
        ...(updateServiceDto.duration_minutes !== undefined && { duration_minutes: updateServiceDto.duration_minutes }),
        ...(updateServiceDto.trainer_id !== undefined && { trainer_id: updateServiceDto.trainer_id }),
        ...(updateServiceDto.category !== undefined && { category: updateServiceDto.category ? sanitizeText(updateServiceDto.category) : null }),
        ...(updateServiceDto.image_url !== undefined && { image_url: updateServiceDto.image_url ? sanitizeText(updateServiceDto.image_url) : null }),
        ...(updateServiceDto.is_active !== undefined && { is_active: updateServiceDto.is_active }),
      });
      
      return await this.serviceRepository.save(service);
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
      const service = await this.findOne(id);
      service.is_active = false;
      await this.serviceRepository.save(service);
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
      const safeLimit = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 5));
      
      return await this.serviceRepository
        .createQueryBuilder('service')
        .leftJoin('service.bookings', 'booking')
        .select('service')
        .addSelect('COUNT(booking.id)', 'booking_count')
        .where('service.is_active = :isActive', { isActive: true })
        .groupBy('service.id')
        .orderBy('booking_count', 'DESC')
        .limit(safeLimit)
        .getMany();
    } catch (error) {
      this.logger.error('Get popular services error:', error);
      throw new InternalServerErrorException('Failed to fetch popular services');
    }
  }

  async getServicesByType(type: string): Promise<Service[]> {
    return this.findAll(type);
  }
}
