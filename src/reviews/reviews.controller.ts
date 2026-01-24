import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req, 
  HttpCode, 
  HttpStatus, 
  ParseUUIDPipe,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiCookieAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CookieJwtGuard } from '../auth/guards/cookie-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { Request } from 'express';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(CookieJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a new review' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: Request & { user: RequestUser }
  ) {
    return this.reviewsService.create(createReviewDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approved reviews (Public)' })
  @ApiQuery({ name: 'approved', required: false, type: Boolean, description: 'Filter by approval status (default: true)' })
  @ApiResponse({ status: 200, description: 'Returns all approved reviews' })
  findAll(@Query('approved') approved?: string) {
    const approvedOnly = approved === undefined || approved === 'true';
    return this.reviewsService.findAll(approvedOnly);
  }

  @Get('approved')
  @ApiOperation({ summary: 'Get all approved reviews' })
  @ApiResponse({ status: 200, description: 'Returns all approved reviews' })
  getApprovedReviews() {
    return this.reviewsService.getApprovedReviews();
  }

  @Get('pending')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all pending reviews (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all pending reviews' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getPendingReviews() {
    return this.reviewsService.getPendingReviews();
  }

  @Get('my-reviews')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get all reviews by the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns user reviews' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyReviews(@Req() req: Request & { user: RequestUser }) {
    return this.reviewsService.findByUser(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Review UUID' })
  @ApiResponse({ status: 200, description: 'Returns the review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(CookieJwtGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a review (Owner or Admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Review UUID' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: Request & { user: RequestUser }
  ) {
    const isAdmin = req.user.role === 'admin';
    return this.reviewsService.update(id, updateReviewDto, req.user.sub, isAdmin);
  }

  @Delete(':id')
  @UseGuards(CookieJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete a review (Owner or Admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Review UUID' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: RequestUser }
  ) {
    const isAdmin = req.user.role === 'admin';
    return this.reviewsService.remove(id, req.user.sub, isAdmin);
  }
}

