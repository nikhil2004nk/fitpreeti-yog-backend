// src/class-schedule/class-schedule.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ClassSchedule, ClassStatus, CLASS_SCHEDULE_TABLE } from './entities/class-schedule.entity';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassScheduleResponseDto } from './dto/class-schedule-response.dto';
import { TrainersService } from '../trainers/trainers.service';
import { ServicesService } from '../services/services.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClassScheduleService {
  private readonly table = CLASS_SCHEDULE_TABLE;

  constructor(
    private readonly clickhouse: ClickhouseService,
    private readonly trainersService: TrainersService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createClassScheduleDto: CreateClassScheduleDto): Promise<ClassScheduleResponseDto> {
    // Check if trainer exists
    const trainer = await this.trainersService.findOne(createClassScheduleDto.trainerId);
    
    // Check if service exists
    const service = await this.servicesService.findOne(createClassScheduleDto.serviceId);

    // Set default values
    const isRecurring = createClassScheduleDto.isRecurring || false;
    // Using a default of 20 since there's no maxCapacity in the Service entity
    const maxParticipants = createClassScheduleDto.maxParticipants || 20;
    
    // Prepare base class data
    const classId = uuidv4();
    const now = new Date().toISOString();
    
    const classData = {
      id: classId,
      title: createClassScheduleDto.title || `Session with ${trainer.name || 'Trainer'}`,
      description: createClassScheduleDto.description || service.description || '',
      start_time: createClassScheduleDto.startTime instanceof Date 
        ? createClassScheduleDto.startTime.toISOString() 
        : createClassScheduleDto.startTime,
      end_time: createClassScheduleDto.endTime instanceof Date 
        ? createClassScheduleDto.endTime.toISOString() 
        : createClassScheduleDto.endTime,
      status: ClassStatus.SCHEDULED,
      max_participants: maxParticipants,
      current_participants: 0,
      trainer_id: createClassScheduleDto.trainerId,
      service_id: createClassScheduleDto.serviceId,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? (createClassScheduleDto.recurrencePattern || 'weekly') : null,
      recurrence_end_date: isRecurring ? 
        (createClassScheduleDto.recurrenceEndDate instanceof Date 
          ? createClassScheduleDto.recurrenceEndDate.toISOString() 
          : createClassScheduleDto.recurrenceEndDate) 
        : null,
      created_at: now,
      updated_at: now,
    };

    // Check for scheduling conflicts
    await this.checkForSchedulingConflicts(classData);

    const columns = Object.keys(classData);
    const values = Object.values(classData).map(v => 
      typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v === null ? 'NULL' : v
    );

    const query = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    await this.clickhouse.query(query);

    return this.mapToDto(await this.findById(classId));
  }

  async findAll(filters: {
    startDate?: string;
    endDate?: string;
    trainerId?: string;
    serviceId?: string;
  } = {}): Promise<ClassScheduleResponseDto[]> {
    const conditions: string[] = [];

    if (filters.startDate) {
      conditions.push(`start_time >= '${filters.startDate}'`);
    }

    if (filters.endDate) {
      conditions.push(`start_time <= '${filters.endDate}'`);
    }

    if (filters.trainerId) {
      conditions.push(`trainer_id = '${filters.trainerId}'`);
    }

    if (filters.serviceId) {
      conditions.push(`service_id = '${filters.serviceId}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT * FROM ${this.table}
      ${whereClause}
      ORDER BY start_time ASC
    `;

    const result = await this.clickhouse.query<ClassSchedule[]>(query);
    return Array.isArray(result) ? result.map(row => this.mapToDto(row)) : [];
  }

  private async findById(id: string): Promise<ClassSchedule> {
    const query = `SELECT * FROM ${this.table} WHERE id = '${id}' LIMIT 1`;
    const result = await this.clickhouse.query<ClassSchedule[]>(query);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new NotFoundException(`Class schedule with ID ${id} not found`);
    }
    
    return result[0];
  }

  async findOne(id: string): Promise<ClassScheduleResponseDto> {
    const classSchedule = await this.findById(id);
    return this.mapToDto(classSchedule);
  }

  async update(
    id: string,
    updateClassScheduleDto: UpdateClassScheduleDto,
  ): Promise<ClassScheduleResponseDto> {
    const existingClass = await this.findById(id);
    
    // Create a new object with the updated fields
    const updatedClass = {
      ...existingClass,
      ...updateClassScheduleDto,
      updated_at: new Date().toISOString()
    };

    // Check for scheduling conflicts, excluding the current class
    await this.checkForSchedulingConflicts(updateClassScheduleDto, id);

    const updates: string[] = [];
    for (const [key, value] of Object.entries(updateClassScheduleDto)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        const escapedValue = typeof value === 'string' 
          ? `'${value.replace(/'/g, "''")}'` 
          : value === null ? 'NULL' : value;
        updates.push(`${dbKey} = ${escapedValue}`);
      }
    }

    if (updates.length === 0) {
      return this.mapToDto(existingClass);
    }

    const setClause = updates.join(', ');
    const query = `
      ALTER TABLE ${this.table}
      UPDATE ${setClause}
      WHERE id = '${id}'
    `;

    await this.clickhouse.query(query);
    return this.mapToDto(await this.findById(id));
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // Will throw if not found
    const query = `ALTER TABLE ${this.table} DELETE WHERE id = '${id}'`;
    await this.clickhouse.query(query);
  }

  async checkTrainerAvailability(
    trainerId: string,
    startTime: Date | string,
    endTime: Date | string,
    excludeClassId?: string,
  ): Promise<{ available: boolean; message?: string }> {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);

    let query = `
      SELECT id, start_time, end_time 
      FROM ${this.table}
      WHERE trainer_id = '${trainerId}'
      AND status != 'cancelled'
      AND (
        (start_time < '${end.toISOString()}' AND end_time > '${start.toISOString()}')
        OR (start_time < '${end.toISOString()}' AND end_time > '${start.toISOString()}')
        OR (start_time <= '${start.toISOString()}' AND end_time >= '${end.toISOString()}')
      )
    `;

    if (excludeClassId) {
      query += ` AND id != '${excludeClassId}'`;
    }

    query += ' LIMIT 1';

    const result = await this.clickhouse.query<Array<{ id: string; start_time: string; end_time: string }>>(query);
    const conflictingClasses = Array.isArray(result) ? result : [];

    if (conflictingClasses.length > 0) {
      const conflict = conflictingClasses[0];
      return {
        available: false,
        message: `Trainer is already booked from ${conflict.start_time} to ${conflict.end_time}`
      };
    }

    return { available: true };
  }

  async updateClassCapacity(
    classId: string,
    change: number = 1,
    action: 'increment' | 'decrement',
  ): Promise<{ currentParticipants: number; maxParticipants: number }> {
    const classData = await this.findById(classId);
    
    if (classData.status !== ClassStatus.SCHEDULED) {
      throw new BadRequestException('Cannot update capacity for a cancelled or completed class');
    }

    let newCount = classData.current_participants;
    
    if (action === 'increment') {
      if (classData.current_participants + change > classData.max_participants) {
        throw new BadRequestException('Class is at maximum capacity');
      }
      newCount += change;
    } else {
      if (classData.current_participants - change < 0) {
        throw new BadRequestException('Cannot have negative participants');
      }
      newCount -= change;
    }

    const query = `
      ALTER TABLE ${this.table}
      UPDATE current_participants = ${newCount}
      WHERE id = '${classId}'
    `;

    await this.clickhouse.query(query);

    return { currentParticipants: newCount, maxParticipants: classData.max_participants };
  }

  async generateRecurringClasses(
    classId: string,
    pattern: 'daily' | 'weekly' | 'monthly' = 'weekly',
    endDate: Date,
  ): Promise<ClassScheduleResponseDto[]> {
    const baseClass = await this.findOne(classId);
    if (!baseClass) {
      throw new NotFoundException('Base class not found');
    }

    const startDate = new Date(baseClass.startTime);
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
          (new Date(baseClass.endTime).getTime() - new Date(baseClass.startTime).getTime()));
        
        const newClass = await this.create({
          ...baseClass,
          startTime: classStart,
          endTime: classEnd,
          isRecurring: true,
          recurrencePattern: pattern,
          recurrenceEndDate: endDate,
        } as CreateClassScheduleDto);
        
        recurringClasses.push(newClass);
      }
      
      currentDate = getNextDate(currentDate);
    }

    return recurringClasses;
  }

  private async checkForSchedulingConflicts(
    classSchedule: CreateClassScheduleDto | UpdateClassScheduleDto | ClassSchedule,
    excludeId?: string,
  ): Promise<void> {
    const trainerId = 'trainerId' in classSchedule ? classSchedule.trainerId : 
                     'trainer_id' in classSchedule ? classSchedule.trainer_id : undefined;
    
    const startTime = 'startTime' in classSchedule ? classSchedule.startTime : 
                     'start_time' in classSchedule ? classSchedule.start_time : undefined;
    
    const endTime = 'endTime' in classSchedule ? classSchedule.endTime : 
                   'end_time' in classSchedule ? classSchedule.end_time : undefined;

    if (!trainerId || !startTime || !endTime) {
      throw new BadRequestException('Missing required fields for scheduling check');
    }

    // Convert to Date objects for comparison
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Check if end time is after start time
    if (endDate <= startDate) {
      throw new BadRequestException('End time must be after start time');
    }

    // Format dates for SQL query
    const formatDate = (date: Date) => date.toISOString().replace('T', ' ').replace('Z', '');
    const startTimeStr = formatDate(startDate);
    const endTimeStr = formatDate(endDate);

    let query = `
      SELECT * FROM ${this.table}
      WHERE trainer_id = '${trainerId}'
      AND status != 'cancelled'
      AND (
        (start_time < '${endTimeStr}' AND end_time > '${startTimeStr}')
        OR (start_time < '${endTimeStr}' AND end_time > '${startTimeStr}')
        OR (start_time <= '${startTimeStr}' AND end_time >= '${endTimeStr}')
      )
    `;

    if (excludeId) {
      query += ` AND id != '${excludeId}'`;
    }

    query += ' LIMIT 1';

    const result = await this.clickhouse.query<ClassSchedule[]>(query);
    const existingClasses = Array.isArray(result) ? result : [];

    if (existingClasses.length > 0) {
      const conflict = existingClasses[0];
      throw new ConflictException(
        `Trainer is already scheduled for a class during this time: ${conflict.start_time} - ${conflict.end_time}`,
      );
    }
  }

  private mapToDto(classSchedule: ClassSchedule): ClassScheduleResponseDto {
    return {
      id: classSchedule.id,
      title: classSchedule.title,
      description: classSchedule.description,
      startTime: classSchedule.start_time,
      endTime: classSchedule.end_time,
      status: classSchedule.status,
      maxParticipants: classSchedule.max_participants,
      currentParticipants: classSchedule.current_participants,
      trainerId: classSchedule.trainer_id,
      serviceId: classSchedule.service_id,
      isRecurring: classSchedule.is_recurring,
      recurrencePattern: classSchedule.recurrence_pattern as 'daily' | 'weekly' | 'monthly' | undefined,
      recurrenceEndDate: classSchedule.recurrence_end_date,
      createdAt: classSchedule.created_at,
      updatedAt: classSchedule.updated_at,
    };
  }
}