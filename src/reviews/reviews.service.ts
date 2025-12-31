import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewWithUser } from './interfaces/review.interface';
import { sanitizeText } from '../common/utils/sanitize.util';
import { TrainersService } from '../trainers/trainers.service';

@Injectable()
export class ReviewsService {
  private readonly database: string;
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private ch: ClickhouseService,
    private configService: ConfigService,
    @Inject(forwardRef(() => TrainersService))
    private trainersService: TrainersService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ReviewWithUser> {
    try {
      const reviewId = require('uuid').v4();
      const now = new Date().toISOString();
      
      const reviewData = {
        id: reviewId,
        user_id: userId,
        booking_id: createReviewDto.booking_id || null,
        rating: createReviewDto.rating,
        comment: sanitizeText(createReviewDto.comment),
        reviewer_type: createReviewDto.reviewer_type ? sanitizeText(createReviewDto.reviewer_type) : null,
        is_approved: false, // Reviews need admin approval by default
        created_at: now,
        updated_at: now
      };

      await this.ch.insert('reviews', reviewData);
      
      // Wait a bit for the insert to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return this.findOne(reviewId);
    } catch (error) {
      this.logger.error('Create review error:', error);
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  async findAll(approvedOnly: boolean = true): Promise<ReviewWithUser[]> {
    try {
      // For ClickHouse, we need to use query instead of queryParams when there's no parameterization
      // Since WHERE clause is conditionally added, we'll build it as a string
      const whereClause = approvedOnly ? 'WHERE r.is_approved = true' : '';
      
      const query = `
        SELECT 
          r.id,
          r.user_id,
          r.booking_id,
          r.rating,
          r.comment,
          r.reviewer_type,
          r.is_approved,
          r.created_at,
          r.updated_at,
          u.name as user_name,
          u.profile_image as user_profile_image
        FROM ${this.database}.reviews r
        LEFT JOIN ${this.database}.users u ON r.user_id = u.id
        ${whereClause}
        ORDER BY r.created_at DESC
      `;
      
      const result = await this.ch.query<ReviewWithUser[]>(query);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      this.logger.error('Find all reviews error:', error);
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  async findOne(id: string): Promise<ReviewWithUser> {
    try {
      const query = `
        SELECT 
          r.id,
          r.user_id,
          r.booking_id,
          r.rating,
          r.comment,
          r.reviewer_type,
          r.is_approved,
          r.created_at,
          r.updated_at,
          u.name as user_name,
          u.profile_image as user_profile_image
        FROM ${this.database}.reviews r
        LEFT JOIN ${this.database}.users u ON r.user_id = u.id
        WHERE r.id = {id:String}
        LIMIT 1
      `;
      
      const result = await this.ch.queryParams<ReviewWithUser[]>(query, { id });
      
      if (!Array.isArray(result) || result.length === 0) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Find one review error:', error);
      throw new InternalServerErrorException('Failed to fetch review');
    }
  }

  async findByUser(userId: string): Promise<ReviewWithUser[]> {
    try {
      const query = `
        SELECT 
          r.id,
          r.user_id,
          r.booking_id,
          r.rating,
          r.comment,
          r.reviewer_type,
          r.is_approved,
          r.created_at,
          r.updated_at,
          u.name as user_name,
          u.profile_image as user_profile_image
        FROM ${this.database}.reviews r
        LEFT JOIN ${this.database}.users u ON r.user_id = u.id
        WHERE r.user_id = {userId:String}
        ORDER BY r.created_at DESC
      `;
      
      const result = await this.ch.queryParams<ReviewWithUser[]>(query, { userId });
      return Array.isArray(result) ? result : [];
    } catch (error) {
      this.logger.error('Find reviews by user error:', error);
      throw new InternalServerErrorException('Failed to fetch user reviews');
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId?: string, isAdmin: boolean = false): Promise<ReviewWithUser> {
    try {
      // Check if review exists
      const existingReview = await this.findOne(id);
      
      // Only allow users to update their own reviews (unless admin)
      if (!isAdmin && userId && existingReview.user_id !== userId) {
        throw new BadRequestException('You can only update your own reviews');
      }

      // Build update fields with sanitization
      const updates: string[] = [];
      
      if (updateReviewDto.rating !== undefined) {
        if (updateReviewDto.rating < 1 || updateReviewDto.rating > 5) {
          throw new BadRequestException('Rating must be between 1 and 5');
        }
        updates.push(`rating = ${updateReviewDto.rating}`);
      }
      
      if (updateReviewDto.comment !== undefined) {
        const sanitizedComment = sanitizeText(updateReviewDto.comment);
        updates.push(`comment = '${sanitizedComment.replace(/'/g, "''")}'`);
      }
      
      if (updateReviewDto.reviewer_type !== undefined) {
        if (updateReviewDto.reviewer_type === null) {
          updates.push(`reviewer_type = NULL`);
        } else {
          const sanitizedType = sanitizeText(updateReviewDto.reviewer_type);
          updates.push(`reviewer_type = '${sanitizedType.replace(/'/g, "''")}'`);
        }
      }
      
      // Track if we need to update trainer rating
      let shouldUpdateTrainerRating = false;
      
      // Check if rating changed (only if review is approved)
      if (updateReviewDto.rating !== undefined && existingReview.is_approved) {
        shouldUpdateTrainerRating = true;
      }
      
      // Track if approval status changed
      let approvalChanged = false;
      
      // Only admins can update is_approved
      if (updateReviewDto.is_approved !== undefined && isAdmin) {
        approvalChanged = existingReview.is_approved !== updateReviewDto.is_approved;
        if (approvalChanged) {
          shouldUpdateTrainerRating = true;
        }
        updates.push(`is_approved = ${updateReviewDto.is_approved}`);
      }
      
      if (updates.length === 0) {
        return this.findOne(id);
      }
      
      // Note: updated_at is the version column for ReplacingMergeTree
      // We cannot update it directly - ClickHouse handles versioning automatically
      // For ReplacingMergeTree, updates create new versions that are merged later
      
      // Execute the update query
      const setClause = updates.join(', ');
      const updateQuery = `
        ALTER TABLE ${this.database}.reviews 
        UPDATE ${setClause}
        WHERE id = {id:String}
      `;
      await this.ch.queryParams(updateQuery, { id });
      
      // Wait for update to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update trainer ratings if needed
      if (shouldUpdateTrainerRating && existingReview.booking_id) {
        try {
          // Get trainer ID from booking -> service
          const bookingQuery = `
            SELECT s.trainer_id
            FROM ${this.database}.bookings b
            INNER JOIN ${this.database}.services s ON b.service_id = s.id
            WHERE b.id = {bookingId:String}
            LIMIT 1
          `;
          const bookingResult = await this.ch.queryParams<any[]>(bookingQuery, { bookingId: existingReview.booking_id });
          
          if (Array.isArray(bookingResult) && bookingResult.length > 0 && bookingResult[0].trainer_id) {
            await this.trainersService.updateTrainerRating(bookingResult[0].trainer_id);
          }
        } catch (error) {
          this.logger.warn('Failed to update trainer rating after review update:', error);
        }
      }
      
      // Return updated review
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Update review error:', error);
      throw new InternalServerErrorException('Failed to update review');
    }
  }

  async remove(id: string, userId?: string, isAdmin: boolean = false): Promise<void> {
    try {
      // Check if review exists
      const existingReview = await this.findOne(id);
      
      // Only allow users to delete their own reviews (unless admin)
      if (!isAdmin && userId && existingReview.user_id !== userId) {
        throw new BadRequestException('You can only delete your own reviews');
      }
      
      // In ClickHouse, we can't actually delete, so we mark as not approved
      // Note: updated_at is the version column - cannot be updated directly
      const updateQuery = `
        ALTER TABLE ${this.database}.reviews 
        UPDATE is_approved = false
        WHERE id = {id:String}
      `;
      await this.ch.queryParams(updateQuery, { id });
      
      // Wait for update to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update trainer rating if review was approved and has a booking
      if (existingReview.is_approved && existingReview.booking_id) {
        try {
          // Get trainer ID from booking -> service
          const bookingQuery = `
            SELECT s.trainer_id
            FROM ${this.database}.bookings b
            INNER JOIN ${this.database}.services s ON b.service_id = s.id
            WHERE b.id = {bookingId:String}
            LIMIT 1
          `;
          const bookingResult = await this.ch.queryParams<any[]>(bookingQuery, { bookingId: existingReview.booking_id });
          
          if (Array.isArray(bookingResult) && bookingResult.length > 0 && bookingResult[0].trainer_id) {
            await this.trainersService.updateTrainerRating(bookingResult[0].trainer_id);
          }
        } catch (error) {
          this.logger.warn('Failed to update trainer rating after review deletion:', error);
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Delete review error:', error);
      throw new InternalServerErrorException('Failed to delete review');
    }
  }

  async getApprovedReviews(): Promise<ReviewWithUser[]> {
    return this.findAll(true);
  }

  async getPendingReviews(): Promise<ReviewWithUser[]> {
    try {
      const query = `
        SELECT 
          r.id,
          r.user_id,
          r.booking_id,
          r.rating,
          r.comment,
          r.reviewer_type,
          r.is_approved,
          r.created_at,
          r.updated_at,
          u.name as user_name,
          u.profile_image as user_profile_image
        FROM ${this.database}.reviews r
        LEFT JOIN ${this.database}.users u ON r.user_id = u.id
        WHERE r.is_approved = false
        ORDER BY r.created_at DESC
      `;
      
      const result = await this.ch.query<ReviewWithUser[]>(query);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      this.logger.error('Get pending reviews error:', error);
      throw new InternalServerErrorException('Failed to fetch pending reviews');
    }
  }
}

