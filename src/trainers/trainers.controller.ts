// src/trainers/trainers.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, HttpCode, HttpStatus, Patch, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';

@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post()
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a new trainer (Admin only)' })
  @ApiResponse({ status: 201, description: 'Trainer created successfully', type: TrainerResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() createTrainerDto: CreateTrainerDto): Promise<TrainerResponseDto> {
    return this.trainersService.create(createTrainerDto);
  }

  @Get()
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all trainers' })
  @ApiResponse({ status: 200, description: 'Returns all trainers', type: [TrainerResponseDto] })
  async findAll(): Promise<TrainerResponseDto[]> {
    return this.trainersService.findAll();
  }

  @Get(':id')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get a trainer by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Trainer UUID' })
  @ApiResponse({ status: 200, description: 'Returns the trainer', type: TrainerResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trainer not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TrainerResponseDto> {
    return this.trainersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a trainer (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Trainer UUID' })
  @ApiResponse({ status: 200, description: 'Trainer updated', type: TrainerResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Trainer not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTrainerDto: UpdateTrainerDto,
  ): Promise<TrainerResponseDto> {
    return this.trainersService.update(id, updateTrainerDto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete a trainer (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Trainer UUID' })
  @ApiResponse({ status: 204, description: 'Trainer deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Trainer not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.trainersService.remove(id);
  }
}