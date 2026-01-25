import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { TrainerPublicResponseDto } from './dto/trainer-public-response.dto';

@ApiTags('Trainers (Public)')
@Controller('trainers/public')
export class TrainersPublicController {
  constructor(private readonly service: TrainersService) {}

  @Get()
  @ApiOperation({ summary: 'Public: Get all available trainers (professional data only)' })
  @ApiResponse({ status: 200, description: 'List of available trainers', type: [TrainerPublicResponseDto] })
  list() {
    return this.service.findAvailablePublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public: Get trainer by ID (professional data only)' })
  @ApiResponse({ status: 200, description: 'Trainer details', type: TrainerPublicResponseDto })
  @ApiResponse({ status: 404, description: 'Trainer not found' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOnePublic(id);
  }
}
