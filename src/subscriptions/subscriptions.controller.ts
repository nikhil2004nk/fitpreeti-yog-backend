import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { SubscriptionStatus } from '../common/enums/subscription.enums';

@ApiTags('Subscriptions (Admin)')
@Controller('admin/subscriptions')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll customer in schedule' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List subscriptions' })
  @ApiQuery({ name: 'customer_id', required: false })
  @ApiQuery({ name: 'schedule_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Query('customer_id') customer_id?: string,
    @Query('schedule_id') schedule_id?: string,
    @Query('status') status?: string,
  ) {
    const filters: any = {};
    if (customer_id) filters.customer_id = parseInt(customer_id, 10);
    if (schedule_id) filters.schedule_id = parseInt(schedule_id, 10);
    if (status) filters.status = status as SubscriptionStatus;
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription (pause/cancel/etc)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubscriptionDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@Param('id', ParseIntPipe) id: number, @Body() body: { reason?: string }) {
    return this.service.cancel(id, body.reason);
  }
}
