import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Customers (Admin)')
@Controller('admin/customers')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create customer',
    description: 'Omit user_id → direct onboarding. If password is provided with email, creates customer with active status and credentials immediately. If password is omitted, creates with onboarding status (draft). Include user_id → link existing user.',
  })
  @ApiResponse({ status: 201, description: 'Customer created' })
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers' })
  @ApiQuery({ name: 'membership_status', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'onboarding | active' })
  list(
    @Query('membership_status') membership_status?: string,
    @Query('status') status?: string,
  ) {
    const filters: { membership_status?: string; status?: string } = {};
    if (membership_status) filters.membership_status = membership_status;
    if (status) filters.status = status;
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer (save as draft during onboarding)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/complete-onboarding')
  @ApiOperation({ summary: 'Complete onboarding and create login credentials' })
  @ApiResponse({ status: 200, description: 'Credentials created' })
  completeOnboarding(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.service.completeOnboarding(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
