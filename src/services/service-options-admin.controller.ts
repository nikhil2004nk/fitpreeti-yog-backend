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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServiceOptionsService } from './service-options.service';
import { CreateServiceOptionDto } from './dto/create-service-option.dto';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Service options (Admin)')
@Controller('admin/service-options')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ServiceOptionsAdminController {
  constructor(private readonly service: ServiceOptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List options (Category / Service Type / Yoga Type). Filter by kind, parent.' })
  @ApiQuery({ name: 'kind', required: false, enum: ['category', 'service_format', 'yoga_type'] })
  @ApiQuery({ name: 'parent', required: false, description: 'Category value for service_format or yoga_type' })
  list(
    @Query('kind') kind?: 'category' | 'service_format' | 'yoga_type',
    @Query('parent') parent?: string,
  ) {
    return this.service.findAll(kind, parent);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get option by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create option (category, service_format, or yoga_type)' })
  create(@Body() dto: CreateServiceOptionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update option' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceOptionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete option' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}
