import { Controller, Get, Put, Body, UseGuards, Req, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from '../customers/customers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { UpdateCustomerDto } from '../customers/dto/update-customer.dto';

@ApiTags('Customer Portal')
@Controller('customer')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CustomerPortalController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'My profile' })
  async profile(@Req() req: { user: RequestUser }) {
    const customer = await this.customersService.findByUserId(Number(req.user.sub));
    if (!customer) return { message: 'Customer profile not found' };
    return customer;
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update my profile' })
  async updateProfile(@Req() req: { user: RequestUser }, @Body() dto: UpdateCustomerDto) {
    const customer = await this.customersService.findByUserId(Number(req.user.sub));
    if (!customer) throw new NotFoundException('Customer profile not found');
    return this.customersService.update(customer.id, dto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'My subscriptions' })
  async subscriptions(@Req() req: { user: RequestUser }) {
    const customer = await this.customersService.findByUserId(Number(req.user.sub));
    if (!customer) return [];
    return this.subscriptionsService.findByCustomer(customer.id);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'My attendance history' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async attendance(
    @Req() req: { user: RequestUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const customer = await this.customersService.findByUserId(Number(req.user.sub));
    if (!customer) return [];
    return this.attendanceService.findByCustomer(customer.id, startDate, endDate);
  }
}
