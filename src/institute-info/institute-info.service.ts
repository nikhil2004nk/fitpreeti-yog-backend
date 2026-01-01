import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { UpdateInstituteInfoDto } from './dto/update-institute-info.dto';
import { InstituteInfo } from './interfaces/institute-info.interface';

@Injectable()
export class InstituteInfoService {
  private readonly database: string;
  private readonly logger = new Logger(InstituteInfoService.name);

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async findOne(): Promise<InstituteInfo> {
    try {
      // Get the most recent record (ReplacingMergeTree ensures only one record after merge)
      const query = `
        SELECT * FROM ${this.database}.institute_info
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      const result = await this.ch.queryParams<InstituteInfo[]>(query, {});

      if (!Array.isArray(result) || result.length === 0) {
        throw new NotFoundException('Institute info not found');
      }

      const info = result[0];
      
      // Parse JSON fields
      return {
        ...info,
        phone_numbers: typeof info.phone_numbers === 'string' 
          ? JSON.parse(info.phone_numbers) 
          : (info.phone_numbers || []),
        social_media: typeof info.social_media === 'string'
          ? JSON.parse(info.social_media)
          : (info.social_media || {}),
      };
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
      let existingRecord: InstituteInfo | null = null;
      try {
        existingRecord = await this.findOne();
      } catch (error) {
        // Record doesn't exist yet, we'll create it
        existingRecord = null;
      }

      const now = new Date().toISOString();
      const id = existingRecord?.id || require('uuid').v4();

      const instituteData = {
        id,
        location: updateInstituteInfoDto.location,
        phone_numbers: JSON.stringify(updateInstituteInfoDto.phone_numbers),
        email: updateInstituteInfoDto.email,
        social_media: JSON.stringify(updateInstituteInfoDto.social_media || {}),
        created_at: existingRecord?.created_at || now,
        updated_at: now,
      };

      // Use insert method (ReplacingMergeTree will replace old record based on updated_at)
      await this.ch.insert('institute_info', instituteData);

      // Retrieve the saved record
      return await this.findOne();
    } catch (error) {
      this.logger.error('Create or update institute info error:', error);
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create or update institute info');
    }
  }
}

