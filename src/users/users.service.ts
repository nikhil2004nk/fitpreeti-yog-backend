import { Injectable, NotFoundException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class UsersService {
  private readonly database: string;

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async findAll() {
    const query = `SELECT 
      id, 
      name, 
      email, 
      phone, 
      role, 
      profile_image, 
      is_active, 
      last_login, 
      created_at, 
      updated_at 
    FROM ${this.database}.users 
    ORDER BY created_at DESC`;
    const result = await this.ch.queryParams<Array<{ 
      id: string; 
      name: string; 
      email: string; 
      phone: string; 
      role: string; 
      profile_image: string | null; 
      is_active: boolean; 
      last_login: string | null; 
      created_at: string; 
      updated_at: string;
    }>>(query, {});
    return Array.isArray(result) ? result : [];
  }

  async findOne(phone: string) {
    const normalizedPhone = normalizePhone(sanitizeText(phone));
    const query = `
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        role, 
        profile_image, 
        is_active, 
        last_login, 
        created_at, 
        updated_at 
      FROM ${this.database}.users 
      WHERE phone = {phone:String}
      LIMIT 1
    `;
    const result = await this.ch.queryParams<Array<{ 
      id: string; 
      name: string; 
      email: string; 
      phone: string; 
      role: string; 
      profile_image: string | null; 
      is_active: boolean; 
      last_login: string | null; 
      created_at: string; 
      updated_at: string;
    }>>(query, { 
      phone: normalizedPhone 
    });
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('User not found');
    }
    return result[0];
  }

  async updateRole(phone: string, role: string) {
    const normalizedPhone = normalizePhone(sanitizeText(phone));
    const sanitizedRole = sanitizeText(role);
    const updateQuery = `
      ALTER TABLE ${this.database}.users 
      UPDATE role = {role:String} 
      WHERE phone = {phone:String}
    `;
    await this.ch.queryParams(updateQuery, { role: sanitizedRole, phone: normalizedPhone });
    return this.findOne(normalizedPhone);
  }
}
