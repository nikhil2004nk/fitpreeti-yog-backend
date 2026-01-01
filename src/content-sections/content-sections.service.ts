import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';
import { ContentSection } from './interfaces/content-section.interface';

@Injectable()
export class ContentSectionsService {
  private readonly database: string;
  private readonly logger = new Logger(ContentSectionsService.name);

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async create(createContentSectionDto: CreateContentSectionDto): Promise<ContentSection> {
    try {
      const sectionId = require('uuid').v4();
      const now = new Date().toISOString();

      const sectionData = {
        id: sectionId,
        section_key: createContentSectionDto.section_key,
        content: JSON.stringify(createContentSectionDto.content),
        order: createContentSectionDto.order ?? 0,
        is_active: createContentSectionDto.is_active ?? true,
        created_at: now,
        updated_at: now,
      };

      await this.ch.insert('content_sections', sectionData);

      const selectQuery = `SELECT * FROM ${this.database}.content_sections WHERE id = {id:String} LIMIT 1`;
      const result = await this.ch.queryParams<ContentSection[]>(selectQuery, { id: sectionId });

      if (!Array.isArray(result) || result.length === 0) {
        throw new InternalServerErrorException('Failed to retrieve the created content section');
      }

      return this.parseContentSection(result[0]);
    } catch (error) {
      this.logger.error('Create content section error:', error);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create content section');
    }
  }

  async findAll(includeInactive: boolean = false): Promise<ContentSection[]> {
    try {
      let query = `
        SELECT * FROM ${this.database}.content_sections
      `;
      
      if (!includeInactive) {
        query += ` WHERE is_active = true`;
      }
      
      query += ` ORDER BY section_key, order, created_at`;

      const result = await this.ch.queryParams<ContentSection[]>(query, {});

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map(section => this.parseContentSection(section));
    } catch (error) {
      this.logger.error('Find all content sections error:', error);
      throw new InternalServerErrorException('Failed to retrieve content sections');
    }
  }

  async findAllGrouped(includeInactive: boolean = false): Promise<Record<string, ContentSection[]>> {
    try {
      const sections = await this.findAll(includeInactive);
      const grouped: Record<string, ContentSection[]> = {};

      sections.forEach(section => {
        if (!grouped[section.section_key]) {
          grouped[section.section_key] = [];
        }
        grouped[section.section_key].push(section);
      });

      return grouped;
    } catch (error) {
      this.logger.error('Find all grouped content sections error:', error);
      throw new InternalServerErrorException('Failed to retrieve grouped content sections');
    }
  }

  async findByKey(key: string): Promise<ContentSection[]> {
    try {
      const query = `
        SELECT * FROM ${this.database}.content_sections
        WHERE section_key = {key:String} AND is_active = true
        ORDER BY order, created_at
      `;
      
      const result = await this.ch.queryParams<ContentSection[]>(query, { key });

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map(section => this.parseContentSection(section));
    } catch (error) {
      this.logger.error('Find content sections by key error:', error);
      throw new InternalServerErrorException('Failed to retrieve content sections by key');
    }
  }

  async findOne(id: string): Promise<ContentSection> {
    try {
      const query = `SELECT * FROM ${this.database}.content_sections WHERE id = {id:String} LIMIT 1`;
      const result = await this.ch.queryParams<ContentSection[]>(query, { id });

      if (!Array.isArray(result) || result.length === 0) {
        throw new NotFoundException(`Content section with ID ${id} not found`);
      }

      return this.parseContentSection(result[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Find content section error:', error);
      throw new InternalServerErrorException('Failed to retrieve content section');
    }
  }

  async update(id: string, updateContentSectionDto: UpdateContentSectionDto): Promise<ContentSection> {
    try {
      await this.findOne(id);

      const updates: string[] = [];
      const updateData: Record<string, any> = {};

      if (updateContentSectionDto.content !== undefined) {
        updates.push('content = {content:String}');
        updateData.content = JSON.stringify(updateContentSectionDto.content);
      }

      // Note: section_key is in ORDER BY clause, cannot be updated directly
      // If section_key needs to change, delete and recreate the section instead
      if (updateContentSectionDto.section_key !== undefined) {
        this.logger.warn('section_key cannot be updated (it is a key column). Delete and recreate the section instead.');
        // Skip section_key updates - it's in the ORDER BY clause
      }

      if (updateContentSectionDto.order !== undefined) {
        updates.push('order = {order:UInt32}');
        updateData.order = updateContentSectionDto.order;
      }

      if (updateContentSectionDto.is_active !== undefined) {
        updates.push('is_active = {is_active:Bool}');
        updateData.is_active = updateContentSectionDto.is_active;
      }

      if (updates.length === 0) {
        return this.findOne(id);
      }

      updates.push('updated_at = now64()');
      updateData.id = id;

      const setClause = updates.join(', ');
      const updateQuery = `
        ALTER TABLE ${this.database}.content_sections
        UPDATE ${setClause}
        WHERE id = {id:String}
      `;

      await this.ch.queryParams(updateQuery, updateData);

      // Wait a bit for eventual consistency, then retrieve
      await new Promise(resolve => setTimeout(resolve, 100));

      return this.findOne(id);
    } catch (error: any) {
      this.logger.error('Update content section error:', error);
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      // Check if it's a ClickHouse key column update error
      if (error?.code === '420' && error?.type === 'CANNOT_UPDATE_COLUMN') {
        throw new InternalServerErrorException(
          'Cannot update key column. If the table was created with an older schema, ' +
          'you may need to recreate it. Contact the backend team for assistance.'
        );
      }
      throw new InternalServerErrorException('Failed to update content section');
    }
  }

  async remove(id: string): Promise<{ id: string; is_active: boolean }> {
    try {
      await this.findOne(id);

      // Soft delete by setting is_active = false
      const updateQuery = `
        ALTER TABLE ${this.database}.content_sections
        UPDATE is_active = false, updated_at = now64()
        WHERE id = {id:String}
      `;

      await this.ch.queryParams(updateQuery, { id });

      return { id, is_active: false };
    } catch (error) {
      this.logger.error('Remove content section error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove content section');
    }
  }

  private parseContentSection(section: any): ContentSection {
    return {
      ...section,
      content: typeof section.content === 'string' 
        ? JSON.parse(section.content) 
        : (section.content || {}),
    };
  }
}

