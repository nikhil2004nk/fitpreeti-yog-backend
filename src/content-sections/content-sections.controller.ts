import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiCookieAuth } from '@nestjs/swagger';
import { ContentSectionsService } from './content-sections.service';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Content Sections')
@Controller('content-sections')
export class ContentSectionsController {
  constructor(private readonly contentSectionsService: ContentSectionsService) {}

  @Post()
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a new content section (Admin only)' })
  @ApiBody({ type: CreateContentSectionDto })
  @ApiResponse({ status: 201, description: 'Content section created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createContentSectionDto: CreateContentSectionDto) {
    return this.contentSectionsService.create(createContentSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active content sections grouped by key (Public)' })
  @ApiQuery({ name: 'include_inactive', required: false, type: Boolean, description: 'Include inactive sections (default: false)' })
  @ApiQuery({ name: 'grouped', required: false, type: Boolean, description: 'Return grouped by section_key (default: true)' })
  @ApiResponse({ status: 200, description: 'Returns all content sections' })
  findAll(
    @Query('include_inactive') includeInactive?: string,
    @Query('grouped') grouped?: string,
  ) {
    const includeInactiveFlag = includeInactive === 'true';
    const groupedFlag = grouped !== 'false'; // Default to true if not specified

    if (groupedFlag) {
      return this.contentSectionsService.findAllGrouped(includeInactiveFlag);
    }
    return this.contentSectionsService.findAll(includeInactiveFlag);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get content sections by key (Public)' })
  @ApiParam({ name: 'key', type: String, description: 'Section key (e.g., "hero", "announcements")' })
  @ApiResponse({ status: 200, description: 'Returns content sections for the specified key' })
  @ApiResponse({ status: 404, description: 'No sections found for the key' })
  findByKey(@Param('key') key: string) {
    return this.contentSectionsService.findByKey(key);
  }

  @Patch(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a content section (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Content section UUID' })
  @ApiBody({ type: UpdateContentSectionDto })
  @ApiResponse({ status: 200, description: 'Content section updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Content section not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContentSectionDto: UpdateContentSectionDto,
  ) {
    return this.contentSectionsService.update(id, updateContentSectionDto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete (deactivate) a content section (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Content section UUID' })
  @ApiResponse({ status: 200, description: 'Content section deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Content section not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentSectionsService.remove(id);
  }
}

