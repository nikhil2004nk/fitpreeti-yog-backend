import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { ServiceType } from '../common/enums/service.enums';

@ApiTags('Services (Public)')
@Controller('services/public')
export class ServicesPublicController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Public: List active services for form' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'class_type', required: false })
  @ApiQuery({ name: 'yoga_style', required: false })
  list(
    @Query('type') type?: string,
    @Query('class_type') class_type?: string,
    @Query('yoga_style') yoga_style?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type as ServiceType;
    if (class_type) filters.class_type = class_type;
    if (yoga_style) filters.yoga_style = yoga_style;
    return this.service.findPublic(filters);
  }
}
