// src/class-schedule/class-schedule.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan, MoreThan } from 'typeorm';
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
import { sanitizeText } from '../common/utils/sanitize.util';

export interface FindAllFilters {
  start_time?: string;
  end_time?: string;
  trainer_id?: string;
  service_id?: string;
}

@Injectable()
export class ClassScheduleService {
  private readonly logger = new Logger(ClassScheduleService.name);

  constructor(
    @InjectRepository(ClassSchedule)
    private readonly classScheduleRepository: Repository<ClassSchedule>,
    private readonly trainersService: TrainersService,
    private readonly servicesService: ServicesService,
  ) {}

  private toClassScheduleResponse(classSchedule: ClassSchedule): ClassScheduleResponseDto {
    return {
      id: classSchedule.id,
      title: classSchedule.title || '',
      description: classSchedule.description || undefined,
      start_time: classSchedule.start_time.toISOString(),
      end_time: classSchedule.end_time.toISOString(),
      status: classSchedule.status || ClassStatus.SCHEDULED,
      max_participants: classSchedule.max_participants || 20,
      current_participants: classSchedule.current_participants || 0,
      trainer_id: classSchedule.trainer_id,
      service_id: classSchedule.service_id,
      is_recurring: classSchedule.is_recurring || false,
      recurrence_pattern: classSchedule.recurrence_pattern || undefined,
      recurrence_end_date: classSchedule.recurrence_end_date?.toISOString() || undefined,
      created_at: classSchedule.created_at.toISOString(),
      updated_at: classSchedule.updated_at.toISOString(),
    };
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
      
      const classSchedule = this.classScheduleRepository.create({
        title: createClassScheduleDto.title || `Session with ${trainer.name || 'Trainer'}`,
        description: createClassScheduleDto.description || service.description || '',
        start_time: startTime,
        end_time: endTime,
        status: ClassStatus.SCHEDULED,
        max_participants: maxParticipants,
        current_participants: 0,
        trainer_id: createClassScheduleDto.trainer_id,
        service_id: createClassScheduleDto.service_id,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? (createClassScheduleDto.recurrence_pattern || 'weekly') : null,
        recurrence_end_date: isRecurring && createClassScheduleDto.recurrence_end_date 
          ? new Date(createClassScheduleDto.recurrence_end_date)
          : null,
      });

      // Check for scheduling conflicts
      await this.checkForSchedulingConflicts(classSchedule);

      const savedClass = await this.classScheduleRepository.save(classSchedule);
      return this.toClassScheduleResponse(savedClass);
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

  async findAll(filters: FindAllFilters = {}): Promise<ClassScheduleResponseDto[]> {
    try {
      const where: any = {};

      if (filters.start_time) {
        where.start_time = MoreThan(new Date(filters.start_time));
      }

      if (filters.end_time) {
        where.end_time = LessThan(new Date(filters.end_time));
      }

      if (filters.trainer_id) {
        where.trainer_id = filters.trainer_id;
      }

      if (filters.service_id) {
        where.service_id = filters.service_id;
      }

      const classSchedules = await this.classScheduleRepository.find({
        where,
        order: { start_time: 'ASC' },
      });

      return classSchedules.map(cs => this.toClassScheduleResponse(cs));
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to fetch class schedules');
    }
  }

  async findOne(id: string): Promise<ClassScheduleResponseDto> {
    try {
      const classSchedule = await this.classScheduleRepository.findOne({ where: { id } });
      if (!classSchedule) {
        throw new NotFoundException(`Class schedule with ID ${id} not found`);
      }
      return this.toClassScheduleResponse(classSchedule);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error in findOne:', error);
      throw new InternalServerErrorException('Failed to fetch class schedule');
    }
  }

  async update(
    id: string,
    updateClassScheduleDto: UpdateClassScheduleDto,
  ): Promise<ClassScheduleResponseDto> {
    try {
      const existingClass = await this.classScheduleRepository.findOne({ where: { id } });
      if (!existingClass) {
        throw new NotFoundException(`Class schedule with ID ${id} not found`);
      }
      
      // Update fields
      Object.assign(existingClass, {
        ...(updateClassScheduleDto.title && { title: sanitizeText(updateClassScheduleDto.title) }),
        ...(updateClassScheduleDto.description !== undefined && { description: updateClassScheduleDto.description ? sanitizeText(updateClassScheduleDto.description) : null }),
        ...(updateClassScheduleDto.start_time && { start_time: new Date(updateClassScheduleDto.start_time) }),
        ...(updateClassScheduleDto.end_time && { end_time: new Date(updateClassScheduleDto.end_time) }),
        ...(updateClassScheduleDto.status && { status: updateClassScheduleDto.status }),
        ...(updateClassScheduleDto.max_participants !== undefined && { max_participants: updateClassScheduleDto.max_participants }),
        ...(updateClassScheduleDto.current_participants !== undefined && { current_participants: updateClassScheduleDto.current_participants }),
        ...(updateClassScheduleDto.trainer_id && { trainer_id: updateClassScheduleDto.trainer_id }),
        ...(updateClassScheduleDto.service_id && { service_id: updateClassScheduleDto.service_id }),
        ...(updateClassScheduleDto.is_recurring !== undefined && { is_recurring: updateClassScheduleDto.is_recurring }),
        ...(updateClassScheduleDto.recurrence_pattern !== undefined && { recurrence_pattern: updateClassScheduleDto.recurrence_pattern }),
        ...(updateClassScheduleDto.recurrence_end_date !== undefined && { recurrence_end_date: updateClassScheduleDto.recurrence_end_date ? new Date(updateClassScheduleDto.recurrence_end_date) : null }),
      });

      // Check for scheduling conflicts, excluding the current class
      await this.checkForSchedulingConflicts(existingClass, id);

      const updatedClass = await this.classScheduleRepository.save(existingClass);
      return this.toClassScheduleResponse(updatedClass);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update class schedule');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const classSchedule = await this.classScheduleRepository.findOne({ where: { id } });
      if (!classSchedule) {
        throw new NotFoundException(`Class schedule with ID ${id} not found`);
      }
      await this.classScheduleRepository.remove(classSchedule);
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

      const where: any = {
        trainer_id,
        status: Not(ClassStatus.CANCELLED),
      };

      if (excludeClassId) {
        where.id = Not(excludeClassId);
      }

      const conflictingClasses = await this.classScheduleRepository
        .createQueryBuilder('class')
        .where('class.trainer_id = :trainer_id', { trainer_id })
        .andWhere('class.status != :status', { status: ClassStatus.CANCELLED })
        .andWhere(
          '(class.start_time < :end AND class.end_time > :start)',
          { start, end }
        )
        .andWhere(excludeClassId ? 'class.id != :excludeId' : '1=1', { excludeId: excludeClassId })
        .getMany();

      if (conflictingClasses.length > 0) {
        const conflict = conflictingClasses[0];
        return {
          available: false,
          message: `Trainer is already booked from ${conflict.start_time.toISOString()} to ${conflict.end_time.toISOString()}`
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
      const classData = await this.classScheduleRepository.findOne({ where: { id: classId } });
      
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

      classData.current_participants = newCount;
      await this.classScheduleRepository.save(classData);

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
      const baseClass = await this.classScheduleRepository.findOne({ where: { id: classId } });
      if (!baseClass) {
        throw new NotFoundException('Base class not found');
      }

      const startDate = new Date(baseClass.start_time);
      const endDateTime = new Date(endDate);
      let currentDate = new Date(startDate);
      const recurringClasses: ClassScheduleResponseDto[] = [];

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

      while (currentDate <= endDateTime) {
        if (currentDate.getTime() !== startDate.getTime()) {
          const classStart = new Date(currentDate);
          const classEnd = new Date(classStart.getTime() + 
            (baseClass.end_time.getTime() - baseClass.start_time.getTime()));
          
          const newClass = this.classScheduleRepository.create({
            title: baseClass.title,
            description: baseClass.description,
            start_time: classStart,
            end_time: classEnd,
            status: baseClass.status,
            max_participants: baseClass.max_participants,
            current_participants: 0,
            trainer_id: baseClass.trainer_id,
            service_id: baseClass.service_id,
            is_recurring: true,
            recurrence_pattern: pattern,
            recurrence_end_date: endDate,
          });
          
          const savedClass = await this.classScheduleRepository.save(newClass);
          recurringClasses.push(this.toClassScheduleResponse(savedClass));
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
    classSchedule: Partial<ClassSchedule>,
    excludeId?: string,
  ): Promise<void> {
    try {
      const { start_time, end_time, trainer_id, service_id } = classSchedule;
      
      if (!start_time || !end_time) {
        throw new BadRequestException('Start time and end time are required');
      }
      
      const startDate = start_time instanceof Date ? start_time : new Date(start_time);
      const endDate = end_time instanceof Date ? end_time : new Date(end_time);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      if (startDate >= endDate) {
        throw new BadRequestException('End time must be after start time');
      }

      const queryBuilder = this.classScheduleRepository
        .createQueryBuilder('class')
        .where(
          '(class.start_time <= :end AND class.end_time >= :start)',
          { start: startDate, end: endDate }
        )
        .andWhere('(class.trainer_id = :trainer_id OR class.service_id = :service_id)', {
          trainer_id,
          service_id,
        });

      if (excludeId) {
        queryBuilder.andWhere('class.id != :excludeId', { excludeId });
      }

      const existingClasses = await queryBuilder.getMany();

      if (existingClasses.length > 0) {
        const conflict = existingClasses[0];
        const conflictType = conflict.trainer_id === trainer_id ? 'trainer' : 'service';
        throw new ConflictException(
          `${conflictType.charAt(0).toUpperCase() + conflictType.slice(1)} is already scheduled for a class during this time: ${conflict.start_time.toISOString()} - ${conflict.end_time.toISOString()}`
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
