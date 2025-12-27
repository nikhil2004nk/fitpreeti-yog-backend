import { Injectable, NotFoundException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';

@Injectable()
export class UsersService {
  constructor(private ch: ClickhouseService) {}

  async findAll() {
    const result = await this.ch.query('SELECT id, phone, role, created_at FROM fitpreeti.users ORDER BY created_at DESC');
    return await result.json();
  }

  async findOne(phone: string) {
    const result = await this.ch.query(`SELECT id, phone, role, created_at FROM fitpreeti.users WHERE phone = '${phone}'`);
    const data = await result.json();
    if (!data.length) throw new NotFoundException('User not found');
    return data[0];
  }

  async updateRole(phone: string, role: string) {
    await this.ch.query(`ALTER TABLE fitpreeti.users UPDATE role = '${role}' WHERE phone = '${phone}'`);
    return this.findOne(phone);
  }
}
