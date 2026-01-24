import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('Categories (Public)')
@Controller('categories/public')
export class ServiceCategoriesPublicController {
  constructor(private readonly service: ServiceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Public: List active categories for form' })
  list() {
    return this.service.findPublic();
  }
}
