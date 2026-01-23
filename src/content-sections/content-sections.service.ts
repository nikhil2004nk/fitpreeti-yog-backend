import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentSection as ContentSectionEntity } from './entities/content-section.entity';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';
import { ContentSection } from './interfaces/content-section.interface';

@Injectable()
export class ContentSectionsService {
  private readonly logger = new Logger(ContentSectionsService.name);

  constructor(
    @InjectRepository(ContentSectionEntity)
    private readonly contentSectionRepository: Repository<ContentSectionEntity>,
  ) {}

  private toContentSection(entity: ContentSectionEntity): ContentSection {
    return {
      id: entity.id,
      section_key: entity.section_key,
      content: entity.content || {},
      order: entity.order,
      is_active: entity.is_active,
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }

  async create(createContentSectionDto: CreateContentSectionDto): Promise<ContentSection> {
    try {
      const section = this.contentSectionRepository.create({
        section_key: createContentSectionDto.section_key,
        content: createContentSectionDto.content,
        order: createContentSectionDto.order ?? 0,
        is_active: createContentSectionDto.is_active ?? true,
      });

      const savedSection = await this.contentSectionRepository.save(section);
      return this.toContentSection(savedSection);
    } catch (error) {
      this.logger.error('Create content section error:', error);
      throw new InternalServerErrorException('Failed to create content section');
    }
  }

  async findAll(includeInactive: boolean = false): Promise<ContentSection[]> {
    try {
      const where: any = {};
      if (!includeInactive) {
        where.is_active = true;
      }

      const sections = await this.contentSectionRepository.find({
        where,
        order: { section_key: 'ASC', order: 'ASC', created_at: 'ASC' },
      });

      return sections.map(section => this.toContentSection(section));
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
      const sections = await this.contentSectionRepository.find({
        where: {
          section_key: key,
          is_active: true,
        },
        order: { order: 'ASC', created_at: 'ASC' },
      });

      return sections.map(section => this.toContentSection(section));
    } catch (error) {
      this.logger.error('Find content sections by key error:', error);
      throw new InternalServerErrorException('Failed to retrieve content sections by key');
    }
  }

  async findOne(id: string): Promise<ContentSection> {
    try {
      const section = await this.contentSectionRepository.findOne({ where: { id } });

      if (!section) {
        throw new NotFoundException(`Content section with ID ${id} not found`);
      }

      return this.toContentSection(section);
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
      const section = await this.contentSectionRepository.findOne({ where: { id } });
      if (!section) {
        throw new NotFoundException(`Content section with ID ${id} not found`);
      }

      // Note: section_key is part of the index, but TypeORM allows updates
      // If you need to change section_key, consider deleting and recreating
      if (updateContentSectionDto.section_key !== undefined && updateContentSectionDto.section_key !== section.section_key) {
        this.logger.warn('section_key change requested. Consider deleting and recreating the section instead.');
      }

      Object.assign(section, {
        ...(updateContentSectionDto.content !== undefined && { content: updateContentSectionDto.content }),
        ...(updateContentSectionDto.section_key !== undefined && { section_key: updateContentSectionDto.section_key }),
        ...(updateContentSectionDto.order !== undefined && { order: updateContentSectionDto.order }),
        ...(updateContentSectionDto.is_active !== undefined && { is_active: updateContentSectionDto.is_active }),
      });

      const savedSection = await this.contentSectionRepository.save(section);
      return this.toContentSection(savedSection);
    } catch (error: any) {
      this.logger.error('Update content section error:', error);
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update content section');
    }
  }

  async remove(id: string): Promise<{ id: string; is_active: boolean }> {
    try {
      const section = await this.contentSectionRepository.findOne({ where: { id } });
      if (!section) {
        throw new NotFoundException(`Content section with ID ${id} not found`);
      }

      // Soft delete by setting is_active = false
      section.is_active = false;
      await this.contentSectionRepository.save(section);

      return { id, is_active: false };
    } catch (error) {
      this.logger.error('Remove content section error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove content section');
    }
  }
}
