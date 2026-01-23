import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Attendance as AttendanceEntity, AttendanceStatus } from './entities/attendance.entity';
import { User } from '../users/entities/user.entity';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';
import { Attendance as AttendanceInterface, AttendanceStats, UserRole } from './interfaces/attendance.interface';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async getUserIdFromPhone(phone: string): Promise<string> {
    const normalizedPhone = normalizePhone(sanitizeText(phone));
    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
      select: ['id'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.id;
  }

  private async getUserInfo(userId: string): Promise<{ id: string; name: string; role: UserRole }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'role'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return {
      id: user.id,
      name: user.name,
      role: user.role as UserRole,
    };
  }

  private async enrichAttendance(att: AttendanceEntity): Promise<AttendanceInterface> {
    const userInfo = await this.getUserInfo(att.user_id);
    let markedByName: string | null = null;
    if (att.marked_by) {
      try {
        const markedByInfo = await this.getUserInfo(att.marked_by);
        markedByName = markedByInfo.name;
      } catch {
        markedByName = null;
      }
    }
    
    return {
      id: att.id,
      user_id: att.user_id,
      user_name: userInfo.name,
      user_role: userInfo.role,
      date: att.date.toISOString().split('T')[0],
      status: att.status,
      marked_by: att.marked_by,
      marked_by_name: markedByName,
      notes: att.notes,
      created_at: att.created_at.toISOString(),
      updated_at: att.updated_at.toISOString(),
    };
  }

  async markOwnAttendance(
    createAttendanceDto: CreateAttendanceDto,
    userPhone: string,
  ): Promise<AttendanceInterface> {
    const userId = await this.getUserIdFromPhone(userPhone);
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(createAttendanceDto.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    
    const date = new Date(createAttendanceDto.date);
    
    const existing = await this.attendanceRepository.findOne({
      where: { user_id: userId, date },
    });
    
    if (existing) {
      const updateDto: UpdateAttendanceDto = {
        status: createAttendanceDto.status,
        notes: createAttendanceDto.notes,
      };
      return this.update(existing.id, updateDto);
    }
    
    const attendance = this.attendanceRepository.create({
      user_id: userId,
      date,
      status: createAttendanceDto.status as any,
      marked_by: null,
      notes: createAttendanceDto.notes ? sanitizeText(createAttendanceDto.notes) : null,
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.enrichAttendance(savedAttendance);
  }

  async getOwnAttendance(
    userPhone: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceInterface[]> {
    const userId = await this.getUserIdFromPhone(userPhone);
    
    const where: any = { user_id: userId };
    
    if (startDate) {
      where.date = MoreThanOrEqual(new Date(startDate));
    }
    
    if (endDate) {
      where.date = LessThanOrEqual(new Date(endDate));
    }
    
    const attendances = await this.attendanceRepository.find({
      where,
      order: { date: 'DESC' },
    });
    
    return Promise.all(attendances.map(att => this.enrichAttendance(att)));
  }

  async markAttendanceForUser(
    createAttendanceDto: CreateAttendanceDto,
    adminUserId: string,
    adminName: string,
  ): Promise<AttendanceInterface> {
    if (!createAttendanceDto.user_id) {
      throw new BadRequestException('user_id is required');
    }
    
    const userInfo = await this.getUserInfo(createAttendanceDto.user_id);
    if (userInfo.role === 'admin') {
      throw new BadRequestException('Cannot mark attendance for admin users');
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(createAttendanceDto.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    
    const date = new Date(createAttendanceDto.date);
    
    const existing = await this.attendanceRepository.findOne({
      where: {
        user_id: createAttendanceDto.user_id,
        date,
      },
    });
    
    if (existing) {
      const updateDto: UpdateAttendanceDto = {
        status: createAttendanceDto.status,
        notes: createAttendanceDto.notes,
      };
      return this.update(existing.id, updateDto);
    }
    
    const attendance = this.attendanceRepository.create({
      user_id: createAttendanceDto.user_id,
      date,
      status: createAttendanceDto.status as any,
      marked_by: adminUserId,
      notes: createAttendanceDto.notes ? sanitizeText(createAttendanceDto.notes) : null,
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.enrichAttendance(savedAttendance);
  }

  async bulkMarkAttendance(
    bulkDto: BulkCreateAttendanceDto,
    adminUserId: string,
    adminName: string,
  ): Promise<AttendanceInterface[]> {
    for (const userId of bulkDto.user_ids) {
      try {
        const userInfo = await this.getUserInfo(userId);
        if (userInfo.role === 'admin') {
          throw new BadRequestException(`Cannot mark attendance for admin user: ${userId}`);
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException(`User not found: ${userId}`);
        }
        throw error;
      }
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bulkDto.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    
    const results: AttendanceInterface[] = [];
    
    for (const userId of bulkDto.user_ids) {
      const createDto: CreateAttendanceDto = {
        user_id: userId,
        date: bulkDto.date,
        status: bulkDto.status,
        notes: bulkDto.notes,
      };
      
      const attendance = await this.markAttendanceForUser(createDto, adminUserId, adminName);
      results.push(attendance);
    }
    
    return results;
  }

  async findAll(filters: {
    user_id?: string;
    user_role?: UserRole;
    start_date?: string;
    end_date?: string;
    status?: AttendanceStatus;
  }): Promise<AttendanceInterface[]> {
    const where: any = {};
    
    if (filters.user_id) {
      where.user_id = filters.user_id;
    }
    
    if (filters.start_date) {
      where.date = MoreThanOrEqual(new Date(filters.start_date));
    }
    
    if (filters.end_date) {
      where.date = LessThanOrEqual(new Date(filters.end_date));
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    const attendances = await this.attendanceRepository.find({
      where,
      order: { date: 'DESC' },
    });
    
    let enriched = await Promise.all(attendances.map(att => this.enrichAttendance(att)));
    
    if (filters.user_role) {
      enriched = enriched.filter(att => att.user_role === filters.user_role);
    }
    
    return enriched;
  }

  async findByUserId(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceInterface[]> {
    await this.getUserInfo(userId);
    
    const filters: {
      user_id: string;
      start_date?: string;
      end_date?: string;
    } = { user_id: userId };
    
    if (startDate) {
      filters.start_date = startDate;
    }
    
    if (endDate) {
      filters.end_date = endDate;
    }
    
    return this.findAll(filters);
  }

  async findOne(id: string): Promise<AttendanceInterface> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    
    return this.enrichAttendance(attendance);
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<AttendanceInterface> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    
    Object.assign(attendance, {
      ...(updateAttendanceDto.status && { status: updateAttendanceDto.status as any }),
      ...(updateAttendanceDto.notes !== undefined && { notes: updateAttendanceDto.notes ? sanitizeText(updateAttendanceDto.notes) : null }),
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.enrichAttendance(savedAttendance);
  }

  async remove(id: string): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    await this.attendanceRepository.remove(attendance);
  }

  async getStatistics(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceStats> {
    await this.getUserInfo(userId);
    
    const where: any = { user_id: userId };
    
    if (startDate) {
      where.date = MoreThanOrEqual(new Date(startDate));
    }
    
    if (endDate) {
      where.date = LessThanOrEqual(new Date(endDate));
    }
    
    const attendances = await this.attendanceRepository.find({ where });
    
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absentDays = attendances.filter(a => a.status === AttendanceStatus.ABSENT).length;
    
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    return {
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      attendance_percentage: Math.round(attendancePercentage * 100) / 100,
    };
  }
}
