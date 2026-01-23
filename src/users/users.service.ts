import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { normalizePhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return await this.userRepository.find({
      select: ['id', 'name', 'email', 'phone', 'role', 'profile_image', 'is_active', 'last_login', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(phone: string) {
    const normalizedPhone = normalizePhone(sanitizeText(phone));
    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
      select: ['id', 'name', 'email', 'phone', 'role', 'profile_image', 'is_active', 'last_login', 'created_at', 'updated_at'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateRole(phone: string, role: string) {
    const normalizedPhone = normalizePhone(sanitizeText(phone));
    const sanitizedRole = sanitizeText(role);
    
    await this.userRepository.update(
      { phone: normalizedPhone },
      { role: sanitizedRole as any }
    );
    
    return this.findOne(normalizedPhone);
  }
}
