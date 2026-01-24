import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Payments (Admin)')
@Controller('admin/payments')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  create(@Req() req: { user: RequestUser }, @Body() dto: CreatePaymentDto) {
    return this.service.create(dto, Number(req.user.sub));
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'customer_id', required: false })
  @ApiQuery({ name: 'subscription_id', required: false })
  list(
    @Query('customer_id') customer_id?: string,
    @Query('subscription_id') subscription_id?: string,
  ) {
    const filters: any = {};
    if (customer_id) filters.customer_id = parseInt(customer_id, 10);
    if (subscription_id) filters.subscription_id = parseInt(subscription_id, 10);
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Payment details' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
