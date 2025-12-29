import { Injectable, NotFoundException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';

@Injectable()
export class UsersService {
  constructor(private ch: ClickhouseService) {}

  /**
   * Normalize phone number by removing spaces, dashes, and other non-digit characters
   * Keeps only digits and leading + for country codes
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    // Remove all non-digit characters except leading +
    const cleaned = phone.trim();
    if (cleaned.startsWith('+')) {
      return '+' + cleaned.slice(1).replace(/\D/g, '');
    }
    return cleaned.replace(/\D/g, '');
  }

  async findAll() {
    // Don't add FORMAT - ClickHouse service handles it automatically
    const result = await this.ch.query<Array<{ id: string; phone: string; role: string; created_at: string }>>(
      'SELECT id, phone, role, created_at FROM fitpreeti.users ORDER BY created_at DESC'
    );
    return Array.isArray(result) ? result : [];
  }

  async findOne(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const escapedPhone = normalizedPhone.replace(/'/g, "''");
    // Don't add FORMAT - ClickHouse service handles it automatically
    const result = await this.ch.query<Array<{ id: string; phone: string; role: string; created_at: string }>>(
      `SELECT id, phone, role, created_at FROM fitpreeti.users WHERE phone = '${escapedPhone}'`
    );
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('User not found');
    }
    return result[0];
  }

  async updateRole(phone: string, role: string) {
    const normalizedPhone = this.normalizePhone(phone);
    await this.ch.query(`ALTER TABLE fitpreeti.users UPDATE role = '${role.replace(/'/g, "''")}' WHERE phone = '${normalizedPhone.replace(/'/g, "''")}'`);
    return this.findOne(normalizedPhone);
  }
}
