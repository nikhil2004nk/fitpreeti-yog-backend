import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Categories (Admin)')
@Controller('admin/categories')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ServiceCategoriesAdminController {
  constructor(private readonly service: ServiceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories (tree)' })
  list() {
    return this.service.findAllTree();
  }

  @Get('flat')
  @ApiOperation({ summary: 'List all categories flat' })
  listFlat() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceCategoryDto) {
    return this.service.update(id, dto);
  }
}
