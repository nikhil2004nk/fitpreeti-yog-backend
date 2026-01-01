import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';
import { Attendance, AttendanceStats, AttendanceStatus, UserRole } from './interfaces/attendance.interface';

@Injectable()
export class AttendanceService {
  private readonly database: string;

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  /**
   * Get user ID from phone number
   */
  private async getUserIdFromPhone(phone: string): Promise<string> {
    const normalizedPhone = normalizePhone(sanitizeText(phone));
    const query = `SELECT id FROM ${this.database}.users WHERE phone = {phone:String} LIMIT 1`;
    const result = await this.ch.queryParams<Array<{ id: string }>>(query, { phone: normalizedPhone });
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('User not found');
    }
    return result[0].id;
  }

  /**
   * Get user info (id, name, role) by user ID
   */
  private async getUserInfo(userId: string): Promise<{ id: string; name: string; role: UserRole }> {
    const query = `
      SELECT id, name, role 
      FROM ${this.database}.users 
      WHERE id = {userId:String}
      LIMIT 1
    `;
    const result = await this.ch.queryParams<Array<{ id: string; name: string; role: string }>>(
      query,
      { userId }
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('User not found');
    }
    
    return {
      id: result[0].id,
      name: result[0].name,
      role: result[0].role as UserRole,
    };
  }

  /**
   * Check if attendance exists for user and date
   */
  private async findAttendanceByUserAndDate(
    userId: string,
    date: string,
  ): Promise<Attendance | null> {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.date,
        a.status,
        a.marked_by,
        a.notes,
        a.created_at,
        a.updated_at
      FROM ${this.database}.attendance AS a
      WHERE a.user_id = {userId:String} AND a.date = {date:String}
      LIMIT 1
    `;
    const result = await this.ch.queryParams<Array<{
      id: string;
      user_id: string;
      date: string;
      status: string;
      marked_by: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>>(query, { userId, date });
    
    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }
    
    const att = result[0];
    
    // Get user info and marked_by info
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
      date: att.date,
      status: att.status as AttendanceStatus,
      marked_by: att.marked_by,
      marked_by_name: markedByName,
      notes: att.notes,
      created_at: att.created_at,
      updated_at: att.updated_at,
    };
  }

  /**
   * Enrich attendance record with user info
   */
  private async enrichAttendance(att: {
    id: string;
    user_id: string;
    date: string;
    status: string;
    marked_by: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }): Promise<Attendance> {
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
      date: att.date,
      status: att.status as AttendanceStatus,
      marked_by: att.marked_by,
      marked_by_name: markedByName,
      notes: att.notes,
      created_at: att.created_at,
      updated_at: att.updated_at,
    };
  }

  /**
   * Mark own attendance (customer/trainer)
   */
  async markOwnAttendance(
    createAttendanceDto: CreateAttendanceDto,
    userPhone: string,
  ): Promise<Attendance> {
    // Get user ID from phone
    const userId = await this.getUserIdFromPhone(userPhone);
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(createAttendanceDto.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    
    // Check if attendance already exists
    const existing = await this.findAttendanceByUserAndDate(userId, createAttendanceDto.date);
    
    if (existing) {
      // Update existing attendance
      const updateDto: UpdateAttendanceDto = {
        status: createAttendanceDto.status,
        notes: createAttendanceDto.notes,
      };
      return this.update(existing.id, updateDto);
    }
    
    // Create new attendance
    const attendanceId = uuidv4();
    const attendanceData = {
      id: attendanceId,
      user_id: userId,
      date: createAttendanceDto.date,
      status: createAttendanceDto.status,
      marked_by: null, // Self-marked
      notes: createAttendanceDto.notes ? sanitizeText(createAttendanceDto.notes) : null,
    };
    
    await this.ch.insert('attendance', attendanceData);
    
    // Wait for insert to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return created attendance
    const created = await this.findAttendanceByUserAndDate(userId, createAttendanceDto.date);
    if (!created) {
      throw new NotFoundException('Failed to retrieve created attendance');
    }
    return created;
  }

  /**
   * Get own attendance records
   */
  async getOwnAttendance(
    userPhone: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    const userId = await this.getUserIdFromPhone(userPhone);
    
    let query = `
      SELECT 
        id,
        user_id,
        date,
        status,
        marked_by,
        notes,
        created_at,
        updated_at
      FROM ${this.database}.attendance
      WHERE user_id = {userId:String}
    `;
    
    const params: Record<string, any> = { userId };
    
    if (startDate) {
      query += ` AND date >= {startDate:String}`;
      params.startDate = startDate;
    }
    
    if (endDate) {
      query += ` AND date <= {endDate:String}`;
      params.endDate = endDate;
    }
    
    query += ` ORDER BY date DESC`;
    
    const result = await this.ch.queryParams<Array<{
      id: string;
      user_id: string;
      date: string;
      status: string;
      marked_by: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>>(query, params);
    
    if (!Array.isArray(result)) {
      return [];
    }
    
    // Enrich with user info
    const enriched = await Promise.all(result.map(att => this.enrichAttendance(att)));
    return enriched;
  }

  /**
   * Mark attendance for user (admin only)
   */
  async markAttendanceForUser(
    createAttendanceDto: CreateAttendanceDto,
    adminUserId: string,
    adminName: string,
  ): Promise<Attendance> {
    if (!createAttendanceDto.user_id) {
      throw new BadRequestException('user_id is required');
    }
    
    // Validate user exists and is customer or trainer (not admin)
    const userInfo = await this.getUserInfo(createAttendanceDto.user_id);
    if (userInfo.role === 'admin') {
      throw new BadRequestException('Cannot mark attendance for admin users');
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(createAttendanceDto.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    
    // Check if attendance already exists
    const existing = await this.findAttendanceByUserAndDate(
      createAttendanceDto.user_id,
      createAttendanceDto.date,
    );
    
    if (existing) {
      // Update existing attendance
      const updateDto: UpdateAttendanceDto = {
        status: createAttendanceDto.status,
        notes: createAttendanceDto.notes,
      };
      return this.update(existing.id, updateDto);
    }
    
    // Create new attendance
    const attendanceId = uuidv4();
    const attendanceData = {
      id: attendanceId,
      user_id: createAttendanceDto.user_id,
      date: createAttendanceDto.date,
      status: createAttendanceDto.status,
      marked_by: adminUserId,
      notes: createAttendanceDto.notes ? sanitizeText(createAttendanceDto.notes) : null,
    };
    
    await this.ch.insert('attendance', attendanceData);
    
    // Wait for insert to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return created attendance
    const created = await this.findAttendanceByUserAndDate(
      createAttendanceDto.user_id,
      createAttendanceDto.date,
    );
    if (!created) {
      throw new NotFoundException('Failed to retrieve created attendance');
    }
    return created;
  }

  /**
   * Bulk mark attendance (admin only)
   */
  async bulkMarkAttendance(
    bulkDto: BulkCreateAttendanceDto,
    adminUserId: string,
    adminName: string,
  ): Promise<Attendance[]> {
    // Validate all user IDs exist
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
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bulkDto.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    
    const results: Attendance[] = [];
    
    // Process each user
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

  /**
   * Get all attendance records with filters (admin only)
   */
  async findAll(filters: {
    user_id?: string;
    user_role?: UserRole;
    start_date?: string;
    end_date?: string;
    status?: AttendanceStatus;
  }): Promise<Attendance[]> {
    let query = `
      SELECT 
        a.id,
        a.user_id,
        a.date,
        a.status,
        a.marked_by,
        a.notes,
        a.created_at,
        a.updated_at
      FROM ${this.database}.attendance AS a
      WHERE 1=1
    `;
    
    const params: Record<string, any> = {};
    
    if (filters.user_id) {
      query += ` AND a.user_id = {userId:String}`;
      params.userId = filters.user_id;
    }
    
    if (filters.start_date) {
      query += ` AND a.date >= {startDate:String}`;
      params.startDate = filters.start_date;
    }
    
    if (filters.end_date) {
      query += ` AND a.date <= {endDate:String}`;
      params.endDate = filters.end_date;
    }
    
    if (filters.status) {
      query += ` AND a.status = {status:String}`;
      params.status = filters.status;
    }
    
    query += ` ORDER BY a.date DESC`;
    
    const result = await this.ch.queryParams<Array<{
      id: string;
      user_id: string;
      date: string;
      status: string;
      marked_by: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>>(query, params);
    
    if (!Array.isArray(result)) {
      return [];
    }
    
    // Enrich with user info
    let enriched = await Promise.all(result.map(att => this.enrichAttendance(att)));
    
    // Filter by user_role if specified (after enrichment)
    if (filters.user_role) {
      enriched = enriched.filter(att => att.user_role === filters.user_role);
    }
    
    return enriched;
  }

  /**
   * Get attendance by user ID (admin only)
   */
  async findByUserId(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    // Validate user exists
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

  /**
   * Get attendance by ID
   */
  async findOne(id: string): Promise<Attendance> {
    const query = `
      SELECT 
        id,
        user_id,
        date,
        status,
        marked_by,
        notes,
        created_at,
        updated_at
      FROM ${this.database}.attendance
      WHERE id = {id:String}
      LIMIT 1
    `;
    const result = await this.ch.queryParams<Array<{
      id: string;
      user_id: string;
      date: string;
      status: string;
      marked_by: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>>(query, { id });
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Attendance record not found');
    }
    
    return this.enrichAttendance(result[0]);
  }

  /**
   * Update attendance (admin only)
   */
  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    // Check if attendance exists
    await this.findOne(id);
    
    // Build update query
    const updates: string[] = [];
    
    if (updateAttendanceDto.status !== undefined) {
      updates.push(`status = '${updateAttendanceDto.status}'`);
    }
    
    if (updateAttendanceDto.notes !== undefined) {
      if (updateAttendanceDto.notes === null) {
        updates.push(`notes = NULL`);
      } else {
        const sanitizedNotes = sanitizeText(updateAttendanceDto.notes).replace(/'/g, "''");
        updates.push(`notes = '${sanitizedNotes}'`);
      }
    }
    
    if (updates.length === 0) {
      return this.findOne(id);
    }
    
    const updateQuery = `
      ALTER TABLE ${this.database}.attendance
      UPDATE ${updates.join(', ')}
      WHERE id = {id:String}
    `;
    
    await this.ch.queryParams(updateQuery, { id });
    
    // Wait for update to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.findOne(id);
  }

  /**
   * Delete attendance (admin only)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    
    const deleteQuery = `ALTER TABLE ${this.database}.attendance DELETE WHERE id = {id:String}`;
    await this.ch.queryParams(deleteQuery, { id });
  }

  /**
   * Get attendance statistics
   */
  async getStatistics(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceStats> {
    // Validate user exists
    await this.getUserInfo(userId);
    
    // Build query
    let query = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
      FROM ${this.database}.attendance
      WHERE user_id = {userId:String}
    `;
    
    const params: Record<string, any> = { userId };
    
    if (startDate) {
      query += ` AND date >= {startDate:String}`;
      params.startDate = startDate;
    }
    
    if (endDate) {
      query += ` AND date <= {endDate:String}`;
      params.endDate = endDate;
    }
    
    const result = await this.ch.queryParams<Array<{
      total_days: number;
      present_days: number;
      absent_days: number;
    }>>(query, params);
    
    if (!Array.isArray(result) || result.length === 0) {
      return {
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        attendance_percentage: 0,
      };
    }
    
    const stats = result[0];
    const totalDays = Number(stats.total_days) || 0;
    const presentDays = Number(stats.present_days) || 0;
    const absentDays = Number(stats.absent_days) || 0;
    
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    return {
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      attendance_percentage: Math.round(attendancePercentage * 100) / 100, // Round to 2 decimal places
    };
  }
}

