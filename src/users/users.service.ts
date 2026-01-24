import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find({
      select: ['id', 'email', 'role', 'is_active', 'last_login', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  async findOneById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'is_active', 'last_login', 'created_at', 'updated_at'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRole(id: number, role: UserRole) {
    await this.userRepository.update({ id }, { role });
    return this.findOneById(id);
  }
}
