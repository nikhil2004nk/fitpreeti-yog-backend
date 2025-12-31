import { Controller, Get, Param, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { UserRole } from '../common/interfaces/user.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':phone')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get a user by phone number (Admin only)' })
  @ApiParam({ name: 'phone', type: String, description: 'User phone number' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('phone') phone: string) {
    return this.usersService.findOne(phone);
  }

  @Patch(':phone/role')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'phone', type: String, description: 'User phone number' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        role: { type: 'string', enum: ['customer', 'admin', 'trainer'] } 
      },
      required: ['role']
    } 
  })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateRole(
    @Param('phone') phone: string,
    @Body('role') role: UserRole,
  ) {
    return this.usersService.updateRole(phone, role);
  }
}
