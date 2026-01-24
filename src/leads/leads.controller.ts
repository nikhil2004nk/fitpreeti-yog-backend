import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Public: Create lead from form' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }
}
