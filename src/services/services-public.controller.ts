import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('Services (Public)')
@Controller('services/public')
export class ServicesPublicController {
  constructor(private readonly service: ServicesService) {}

  @Get('options')
  @ApiOperation({
    summary: 'Public: Flow config (type, service_format_by_type, yoga_types_by_type, mode, frequency, audience)',
  })
  options() {
    return this.service.getFlowOptions();
  }

  @Get()
  @ApiOperation({ summary: 'Public: List active services. Filter by type → format → yoga_type → duration.' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'service_format', required: false })
  @ApiQuery({ name: 'yoga_type', required: false })
  @ApiQuery({ name: 'mode', required: false })
  @ApiQuery({ name: 'frequency', required: false })
  @ApiQuery({ name: 'duration_minutes', required: false })
  list(
    @Query('type') type?: string,
    @Query('service_format') service_format?: string,
    @Query('yoga_type') yoga_type?: string,
    @Query('mode') mode?: string,
    @Query('frequency') frequency?: string,
    @Query('duration_minutes') duration_minutes?: string,
  ) {
    const filters: Record<string, unknown> = {};
    if (type) filters.type = type;
    if (service_format) filters.service_format = service_format;
    if (yoga_type) filters.yoga_type = yoga_type;
    if (mode) filters.mode = mode;
    if (frequency) filters.frequency = frequency;
    const dur = duration_minutes ? parseInt(duration_minutes, 10) : NaN;
    if (!isNaN(dur)) filters.duration_minutes = dur;
    return this.service.findPublic(filters as Parameters<typeof this.service.findPublic>[0]);
  }
}
