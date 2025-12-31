// src/class-schedule/class-schedule.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../database/clickhouse.service';
import { 
  ClassSchedule, 
  ClassStatus, 
  CLASS_SCHEDULE_TABLE
} from './entities/class-schedule.entity';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassScheduleResponseDto } from './dto/class-schedule-response.dto';
import { TrainersService } from '../trainers/trainers.service';
import { ServicesService } from '../services/services.service';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeText } from '../common/utils/sanitize.util';
// Using native Date methods instead of date-fns to avoid additional dependency
// You can install date-fns later if needed: npm install date-fns @types/date-fns

export interface FindAllFilters {
  start_time?: string;
  end_time?: string;
  trainer_id?: string;
  service_id?: string;
}

@Injectable()
export class ClassScheduleService {
  private readonly database: string;
  private readonly table: string;
  private readonly logger = new Logger(ClassScheduleService.name);

  constructor(
    private readonly clickhouse: ClickhouseService,
    private readonly trainersService: TrainersService,
    private readonly servicesService: ServicesService,
    private readonly configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    this.table = `${this.database}.${CLASS_SCHEDULE_TABLE}`;
  }

  /**
   * Convert ISO datetime string to ClickHouse DateTime64(3) format
   * ClickHouse expects: YYYY-MM-DD HH:mm:ss.SSS (no T or Z)
   */
  private toClickHouseDateTime(dateTime: string | Date): string {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${dateTime}`);
    }
    // Convert to ClickHouse format: YYYY-MM-DD HH:mm:ss.SSS
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  private toClassScheduleResponse(classSchedule: any): ClassScheduleResponseDto {
    // Ensure all required fields have proper defaults
    const response: ClassScheduleResponseDto = {
      id: classSchedule.id,
      title: classSchedule.title || '',
      description: classSchedule.description || null,
      start_time: classSchedule.start_time,
      end_time: classSchedule.end_time,
      status: classSchedule.status || ClassStatus.SCHEDULED,
      max_participants: classSchedule.max_participants || 20,
      current_participants: classSchedule.current_participants || 0,
      trainer_id: classSchedule.trainer_id,
      service_id: classSchedule.service_id,
      is_recurring: classSchedule.is_recurring || false,
      recurrence_pattern: classSchedule.recurrence_pattern || null,
      recurrence_end_date: classSchedule.recurrence_end_date || null,
      created_at: classSchedule.created_at,
      updated_at: classSchedule.updated_at,
    };
    
    return response;
  }

  async create(createClassScheduleDto: CreateClassScheduleDto): Promise<ClassScheduleResponseDto> {
    try {
      // Check if trainer exists
      const trainer = await this.trainersService.findOne(createClassScheduleDto.trainer_id);
      if (!trainer) {
        throw new NotFoundException(`Trainer with ID ${createClassScheduleDto.trainer_id} not found`);
      }
      
      // Check if service exists
      const service = await this.servicesService.findOne(createClassScheduleDto.service_id);
      if (!service) {
        throw new NotFoundException(`Service with ID ${createClassScheduleDto.service_id} not found`);
      }

      // Parse and validate dates
      const startTime = new Date(createClassScheduleDto.start_time);
      const endTime = new Date(createClassScheduleDto.end_time);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      
      if (startTime >= endTime) {
        throw new BadRequestException('End time must be after start time');
      }

      // Set default values
      const isRecurring = createClassScheduleDto.is_recurring || false;
      const maxParticipants = createClassScheduleDto.max_participants || 20;
      
      // Prepare base class data
      const classId = uuidv4();
      const now = this.toClickHouseDateTime(new Date());
      
      // Format dates for ClickHouse (YYYY-MM-DD HH:mm:ss.SSS)
      const classData = {
        id: classId,
        title: createClassScheduleDto.title || `Session with ${trainer.name || 'Trainer'}`,
        description: createClassScheduleDto.description || service.description || '',
        start_time: this.toClickHouseDateTime(startTime),
        end_time: this.toClickHouseDateTime(endTime),
        status: ClassStatus.SCHEDULED,
        max_participants: maxParticipants,
        current_participants: 0,
        trainer_id: createClassScheduleDto.trainer_id,
        service_id: createClassScheduleDto.service_id,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? (createClassScheduleDto.recurrence_pattern || 'weekly') : null,
        recurrence_end_date: isRecurring && createClassScheduleDto.recurrence_end_date 
          ? this.toClickHouseDateTime(new Date(createClassScheduleDto.recurrence_end_date))
          : null,
        created_at: now,
        updated_at: now,
      };

      // Check for scheduling conflicts
      await this.checkForSchedulingConflicts(classData);

      // Use insert() method instead of raw query
      await this.clickhouse.insert(CLASS_SCHEDULE_TABLE, classData);

      const createdClass = await this.findById(classId);
      if (!createdClass) {
        throw new InternalServerErrorException('Failed to create class schedule');
      }

      return this.toClassScheduleResponse(createdClass);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating class schedule:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to create class schedule'
      );
    }
  }

  async findAll(filters: {
    start_time?: string;
    end_time?: string;
    trainer_id?: string;
    service_id?: string;
  } = {}): Promise<ClassScheduleResponseDto[]> {
    try {
      let query = `SELECT * FROM ${this.table}`;
      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (filters.start_time) {
        conditions.push(`start_time >= {start_time:String}`);
        params.start_time = filters.start_time;
      }

      if (filters.end_time) {
        conditions.push(`end_time <= {end_time:String}`);
        params.end_time = filters.end_time;
      }

      if (filters.trainer_id) {
        conditions.push(`trainer_id = {trainer_id:String}`);
        params.trainer_id = filters.trainer_id;
      }

      if (filters.service_id) {
        conditions.push(`service_id = {service_id:String}`);
        params.service_id = filters.service_id;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY start_time ASC';

      const result = await this.clickhouse.queryParams<any[]>(query, params);
      return Array.isArray(result) ? result.map((item: any) => this.toClassScheduleResponse(item)) : [];
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to fetch class schedules');
    }
  }

  // Find a class schedule by ID (internal use)
  private async findById(id: string): Promise<ClassSchedule | null> {
    try {
      const query = `SELECT * FROM ${this.table} FINAL WHERE id = {id:String} LIMIT 1`;
      const result = await this.clickhouse.queryParams<ClassSchedule[]>(query, { id });
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error('Error in findById:', error);
      return null;
    }
  }

  async findOne(id: string): Promise<ClassScheduleResponseDto> {
    try {
      const classSchedule = await this.findById(id);
      if (!classSchedule) {
        throw new NotFoundException(`Class schedule with ID ${id} not found`);
      }
      return this.toClassScheduleResponse(classSchedule);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException('Failed to fetch class schedule');
    }
  }

  async update(
    id: string,
    updateClassScheduleDto: UpdateClassScheduleDto,
  ): Promise<ClassScheduleResponseDto> {
    try {
      const existingClass = await this.findById(id);
      if (!existingClass) {
        throw new NotFoundException(`Class schedule with ID ${id} not found`);
      }
      
      // Create a new object with the updated fields
      const updatedClass = {
        ...existingClass,
        ...updateClassScheduleDto,
        updated_at: this.toClickHouseDateTime(new Date())
      };

      // Check for scheduling conflicts, excluding the current class
      await this.checkForSchedulingConflicts(updatedClass, id);

      // Key columns that cannot be updated directly in ClickHouse (part of ORDER BY clause)
      // ORDER BY (start_time, status) means both are key columns
      const keyColumns = ['start_time', 'status'];
      
      // If trying to update key columns, we need to delete and recreate
      const needsRecreate = keyColumns.some(key => 
        updateClassScheduleDto[key as keyof UpdateClassScheduleDto] !== undefined
      );
      
      if (needsRecreate) {
        // For key column updates, delete old and create new
        const newClassData: CreateClassScheduleDto = {
          title: (updateClassScheduleDto.title ?? existingClass.title) as string,
          description: updateClassScheduleDto.description ?? existingClass.description,
          start_time: (updateClassScheduleDto.start_time ?? existingClass.start_time) as string,
          end_time: (updateClassScheduleDto.end_time ?? existingClass.end_time) as string,
          status: (updateClassScheduleDto.status ?? existingClass.status) as any,
          max_participants: updateClassScheduleDto.max_participants ?? existingClass.max_participants,
          current_participants: updateClassScheduleDto.current_participants ?? existingClass.current_participants,
          trainer_id: (updateClassScheduleDto.trainer_id ?? existingClass.trainer_id) as string,
          service_id: (updateClassScheduleDto.service_id ?? existingClass.service_id) as string,
          is_recurring: updateClassScheduleDto.is_recurring ?? existingClass.is_recurring,
          recurrence_pattern: updateClassScheduleDto.recurrence_pattern ?? existingClass.recurrence_pattern,
          recurrence_end_date: updateClassScheduleDto.recurrence_end_date ?? existingClass.recurrence_end_date,
        };
        
        // Delete the old class
        await this.remove(id);
        
        // Create the new class with updated values (will get a new ID)
        const newClass = await this.create(newClassData);
        
        // Note: The new class will have a different ID, but we return it anyway
        // The client should handle the ID change if needed
        return newClass;
      }

      // For non-key columns, proceed with normal update
      const updates: string[] = [];
      for (const [key, value] of Object.entries(updateClassScheduleDto)) {
        // Skip key columns and undefined values
        if (value !== undefined && !keyColumns.includes(key)) {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          const sanitizedValue = typeof value === 'string' 
            ? sanitizeText(value).replace(/'/g, "''")
            : value;
          const escapedValue = typeof sanitizedValue === 'string' 
            ? `'${sanitizedValue}'` 
            : sanitizedValue === null ? 'NULL' : sanitizedValue;
          updates.push(`${dbKey} = ${escapedValue}`);
        }
      }

      if (updates.length === 0) {
        return this.toClassScheduleResponse(existingClass);
      }

      // Note: updated_at is the version column for ReplacingMergeTree
      // ClickHouse handles versioning automatically - we cannot update it directly
      // The updated_at will be automatically set when the merge happens
      
      const setClause = updates.join(', ');
      const updateQuery = `
        ALTER TABLE ${this.table}
        UPDATE ${setClause}
        WHERE id = {id:String}
      `;

      await this.clickhouse.queryParams(updateQuery, { id });
      
      // Wait for update to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return updated class
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update class schedule');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if class exists
      await this.findOne(id);
      
      // Use ALTER TABLE DELETE for ClickHouse
      const deleteQuery = `ALTER TABLE ${this.table} DELETE WHERE id = {id:String}`;
      await this.clickhouse.queryParams(deleteQuery, { id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error in remove:', error);
      throw new InternalServerErrorException('Failed to delete class schedule');
    }
  }

  async checkTrainerAvailability(
    trainer_id: string,
    start_time: Date | string,
    end_time: Date | string,
    excludeClassId?: string,
  ): Promise<{ available: boolean; message?: string }> {
    try {
      const start = start_time instanceof Date ? start_time : new Date(start_time);
      const end = end_time instanceof Date ? end_time : new Date(end_time);

      let query = `
        SELECT id, start_time, end_time 
        FROM ${this.table}
        WHERE trainer_id = {trainer_id:String}
          AND status != 'cancelled'
          AND (
            (start_time < {end_time:String} AND end_time > {start_time:String})
            OR (start_time <= {start_time:String} AND end_time >= {end_time:String})
          )
      `;

      const params: Record<string, any> = {
        trainer_id,
        start_time: this.toClickHouseDateTime(start),
        end_time: this.toClickHouseDateTime(end),
      };

      if (excludeClassId) {
        query += ` AND id != {excludeClassId:String}`;
        params.excludeClassId = excludeClassId;
      }

      query += ' LIMIT 1';

      const result = await this.clickhouse.queryParams<Array<{ id: string; start_time: string; end_time: string }>>(query, params);
      const conflictingClasses = Array.isArray(result) ? result : [];

      if (conflictingClasses.length > 0) {
        const conflict = conflictingClasses[0];
        return {
          available: false,
          message: `Trainer is already booked from ${conflict.start_time} to ${conflict.end_time}`
        };
      }

      return { available: true };
    } catch (error) {
      this.logger.error('Failed to check trainer availability:', error);
      throw new InternalServerErrorException('Failed to check trainer availability');
    }
  }

  async updateClassCapacity(
    classId: string,
    change: number = 1,
    action: 'increment' | 'decrement',
  ): Promise<{ currentParticipants: number; maxParticipants: number }> {
    try {
      const classData = await this.findById(classId);
      
      if (!classData) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }
      
      if (classData.status !== ClassStatus.SCHEDULED) {
        throw new BadRequestException('Cannot update capacity for a cancelled or completed class');
      }

      const currentParticipants = classData.current_participants || 0;
      const maxParticipants = classData.max_participants || 20;
      let newCount = currentParticipants;
      
      if (action === 'increment') {
        if (currentParticipants + change > maxParticipants) {
          throw new BadRequestException('Class is at maximum capacity');
        }
        newCount += change;
      } else {
        if (currentParticipants - change < 0) {
          throw new BadRequestException('Cannot have negative participants');
        }
        newCount -= change;
      }

      const updateQuery = `
        ALTER TABLE ${this.table}
        UPDATE current_participants = {newCount:UInt32}, updated_at = {updated_at:String}
        WHERE id = {classId:String}
      `;

      await this.clickhouse.queryParams(updateQuery, { 
        classId, 
        newCount, 
        updated_at: this.toClickHouseDateTime(new Date())
      });

      return { currentParticipants: newCount, maxParticipants };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update class capacity');
    }
  }

  async generateRecurringClasses(
    classId: string,
    pattern: 'daily' | 'weekly' | 'monthly' = 'weekly',
    endDate: Date,
  ): Promise<ClassScheduleResponseDto[]> {
    try {
      const baseClass = await this.findOne(classId);
      if (!baseClass) {
        throw new NotFoundException('Base class not found');
      }

      const startDate = new Date(baseClass.start_time);
      const endDateTime = new Date(endDate);
      let currentDate = new Date(startDate);
      const recurringClasses: ClassScheduleResponseDto[] = [];

      // Calculate interval based on pattern
      const getNextDate = (date: Date): Date => {
        const nextDate = new Date(date);
        switch (pattern) {
          case 'daily':
            nextDate.setDate(date.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(date.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(date.getMonth() + 1);
            break;
        }
        return nextDate;
      };

      // Generate recurring classes
      while (currentDate <= endDateTime) {
        // Skip the base class date
        if (currentDate.getTime() !== startDate.getTime()) {
          const classStart = new Date(currentDate);
          const classEnd = new Date(classStart.getTime() + 
            (new Date(baseClass.end_time).getTime() - new Date(baseClass.start_time).getTime()));
          
          const newClass = await this.create({
            ...baseClass,
            start_time: classStart.toISOString(),
            end_time: classEnd.toISOString(),
            is_recurring: true,
            recurrence_pattern: pattern,
            recurrence_end_date: endDate.toISOString(),
          } as CreateClassScheduleDto);
          
          recurringClasses.push(newClass);
        }
        
        currentDate = getNextDate(currentDate);
      }

      return recurringClasses;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate recurring classes');
    }
  }

  private async checkForSchedulingConflicts(
    classSchedule: CreateClassScheduleDto | UpdateClassScheduleDto | (Omit<ClassSchedule, 'recurrence_pattern' | 'recurrence_end_date'> & { recurrence_pattern?: string | null; recurrence_end_date?: string | null }),
    excludeId?: string,
  ): Promise<void> {
    try {
      const { start_time, end_time, trainer_id, service_id } = classSchedule;
      const id = 'id' in classSchedule ? classSchedule.id : undefined;
      
      // Convert to Date objects for comparison
      if (!start_time || !end_time) {
        throw new BadRequestException('Start time and end time are required');
      }
      
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      // Check if end time is after start time
      if (startDate >= endDate) {
        throw new BadRequestException('End time must be after start time');
      }

      // Format dates for ClickHouse SQL query (YYYY-MM-DD HH:mm:ss.SSS)
      const startTimeStr = this.toClickHouseDateTime(startDate);
      const endTimeStr = this.toClickHouseDateTime(endDate);

      // Build the query with parameterized values
      let query = `
        SELECT id, start_time, end_time, trainer_id, service_id 
        FROM ${this.table}
        WHERE 
          (
            (start_time <= {end_time:String} AND end_time >= {start_time:String}) OR
            (start_time >= {start_time:String} AND end_time <= {end_time:String})
          )
          AND (trainer_id = {trainer_id:String} OR service_id = {service_id:String})
      `;

      const params: Record<string, any> = {
        start_time: startTimeStr,
        end_time: endTimeStr,
        trainer_id,
        service_id,
      };

      // Add ID exclusion if provided
      if (id) {
        query += ` AND id != {exclude_id:String}`;
        params.exclude_id = id;
      }
      
      // Add excludeId if provided (for update operations)
      if (excludeId) {
        query += ` AND id != {excludeId:String}`;
        params.excludeId = excludeId;
      }

      query += ' LIMIT 1';

      const result = await this.clickhouse.queryParams<Array<{ 
        id: string; 
        start_time: string; 
        end_time: string;
        trainer_id: string;
        service_id: string;
      }>>(query, params);
      
      const existingClasses = Array.isArray(result) ? result : [];

      if (existingClasses.length > 0) {
        const conflict = existingClasses[0];
        // Check if the conflict is with the trainer or the service
        const conflictType = conflict.trainer_id === trainer_id ? 'trainer' : 'service';
        throw new ConflictException(
          `${conflictType.charAt(0).toUpperCase() + conflictType.slice(1)} is already scheduled for a class during this time: ${conflict.start_time} - ${conflict.end_time}`
        );
      }
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error in checkForSchedulingConflicts:', error);
      throw new InternalServerErrorException('Error checking for scheduling conflicts');
    }
  }
}