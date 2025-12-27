import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { UserRole } from '../common/interfaces/user.interface';

@Controller('users')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':phone')
  findOne(@Param('phone') phone: string) {
    return this.usersService.findOne(phone);
  }

  @Patch(':phone/role')
  updateRole(@Param('phone') phone: string, @Body('role') role: UserRole) {
    return this.usersService.updateRole(phone, role);
  }
}
