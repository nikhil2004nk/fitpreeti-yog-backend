import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { InstituteInfoService } from './institute-info.service';
import { UpdateInstituteInfoDto } from './dto/update-institute-info.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Institute Info')
@Controller('institute-info')
export class InstituteInfoController {
  constructor(private readonly instituteInfoService: InstituteInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Get institute contact information (Public)' })
  @ApiResponse({ status: 200, description: 'Returns institute contact information' })
  @ApiResponse({ status: 404, description: 'Institute info not found' })
  findOne() {
    return this.instituteInfoService.findOne();
  }

  @Put()
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create or update institute information (Admin only)' })
  @ApiBody({ type: UpdateInstituteInfoDto })
  @ApiResponse({ status: 200, description: 'Institute info updated successfully' })
  @ApiResponse({ status: 201, description: 'Institute info created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  update(@Body() updateInstituteInfoDto: UpdateInstituteInfoDto) {
    return this.instituteInfoService.createOrUpdate(updateInstituteInfoDto);
  }
}

