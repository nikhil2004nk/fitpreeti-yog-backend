import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Trainers (Admin)')
@Controller('admin/trainers')
@UseGuards(CookieJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TrainersController {
  constructor(private readonly service: TrainersService) {}

  @Post()
  @ApiOperation({ summary: 'Create trainer + user' })
  @ApiResponse({ status: 201, description: 'Trainer created' })
  create(@Body() dto: CreateTrainerDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all trainers' })
  list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trainer by ID' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update trainer' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrainerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate trainer' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }
}
