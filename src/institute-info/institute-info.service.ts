import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstituteInfo as InstituteInfoEntity } from './entities/institute-info.entity';
import { UpdateInstituteInfoDto } from './dto/update-institute-info.dto';
import { InstituteInfo } from './interfaces/institute-info.interface';

@Injectable()
export class InstituteInfoService {
  private readonly logger = new Logger(InstituteInfoService.name);

  constructor(
    @InjectRepository(InstituteInfoEntity)
    private readonly instituteInfoRepository: Repository<InstituteInfoEntity>,
  ) {}

  private toInstituteInfo(entity: InstituteInfoEntity): InstituteInfo {
    return {
      id: entity.id,
      location: entity.location,
      phone_numbers: entity.phone_numbers || [],
      email: entity.email,
      social_media: entity.social_media || {},
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }

  async findOne(): Promise<InstituteInfo> {
    try {
      // Get the most recent record (singleton pattern)
      const records = await this.instituteInfoRepository.find({
        order: { updated_at: 'DESC' },
        take: 1,
      });

      if (!records || records.length === 0) {
        throw new NotFoundException('Institute info not found');
      }

      return this.toInstituteInfo(records[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Find institute info error:', error);
      throw new InternalServerErrorException('Failed to retrieve institute info');
    }
  }

  async createOrUpdate(updateInstituteInfoDto: UpdateInstituteInfoDto): Promise<InstituteInfo> {
    try {
      // Check if record exists
      const records = await this.instituteInfoRepository.find({
        order: { updated_at: 'DESC' },
        take: 1,
      });
      let existingRecord = records && records.length > 0 ? records[0] : null;

      if (existingRecord) {
        // Update existing record
        Object.assign(existingRecord, {
          location: updateInstituteInfoDto.location,
          phone_numbers: updateInstituteInfoDto.phone_numbers,
          email: updateInstituteInfoDto.email,
          social_media: updateInstituteInfoDto.social_media || {},
        });

        const saved = await this.instituteInfoRepository.save(existingRecord);
        return this.toInstituteInfo(saved);
      } else {
        // Create new record
        const instituteInfo = this.instituteInfoRepository.create({
          location: updateInstituteInfoDto.location,
          phone_numbers: updateInstituteInfoDto.phone_numbers,
          email: updateInstituteInfoDto.email,
          social_media: updateInstituteInfoDto.social_media || {},
        });

        const saved = await this.instituteInfoRepository.save(instituteInfo);
        return this.toInstituteInfo(saved);
      }
    } catch (error) {
      this.logger.error('Create or update institute info error:', error);
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create or update institute info');
    }
  }
}
