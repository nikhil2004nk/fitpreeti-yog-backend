import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, getRepository, DataSource } from 'typeorm';
import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewWithUser } from './interfaces/review.interface';
import { sanitizeText } from '../common/utils/sanitize.util';
import { TrainersService } from '../trainers/trainers.service';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class ReviewsService implements OnModuleInit {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => TrainersService))
    private trainersService: TrainersService,
  ) {}

  async onModuleInit() {
    // Service initialization complete
  }

  private toReviewWithUser(review: Review, user?: User): ReviewWithUser {
    if (!review) {
      throw new Error('Review is undefined');
    }

    let userName = '';
    try {
      userName = user?.email || '';
    } catch (userError) {
      this.logger.warn('Error accessing user email:', userError);
      userName = '';
    }

    return {
      id: review.id,
      user_id: review.user_id,
      booking_id: review.booking_id,
      rating: review.rating,
      comment: review.comment,
      reviewer_type: review.reviewer_type,
      is_approved: review.is_approved,
      created_at: review.created_at ? review.created_at.toISOString() : new Date().toISOString(),
      updated_at: review.updated_at ? review.updated_at.toISOString() : new Date().toISOString(),
      user_name: userName,
      user_profile_image: null,
    };
  }

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ReviewWithUser> {
    try {
      const review = this.reviewRepository.create({
        user_id: parseInt(userId),
        booking_id: createReviewDto.booking_id || null,
        rating: createReviewDto.rating,
        comment: sanitizeText(createReviewDto.comment),
        reviewer_type: createReviewDto.reviewer_type ? sanitizeText(createReviewDto.reviewer_type) : null,
        is_approved: false,
      });

      const savedReview = await this.reviewRepository.save(review);
      const user = await this.userRepository.findOne({ where: { id: parseInt(userId) } });
      
      return this.toReviewWithUser(savedReview, user || undefined);
    } catch (error) {
      this.logger.error('Create review error:', error);
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  async findAll(approvedOnly: boolean = true): Promise<ReviewWithUser[]> {
    // Use injected repository, or fallback to dataSource repository
    const repository = this.reviewRepository || this.dataSource.getRepository(Review);

    if (!repository) {
      throw new InternalServerErrorException('Database repository not available');
    }

    const where: any = {};
    if (approvedOnly) {
      where.is_approved = true;
    }

    try {
      const reviews = await repository.find({
        where,
        order: { created_at: 'DESC' },
      });

      // Return basic review data without user info for public endpoint
      return reviews.map(review => ({
        id: review.id,
        user_id: review.user_id,
        booking_id: review.booking_id,
        rating: review.rating,
        comment: review.comment,
        reviewer_type: review.reviewer_type,
        is_approved: review.is_approved,
        created_at: review.created_at ? review.created_at.toISOString() : new Date().toISOString(),
        updated_at: review.updated_at ? review.updated_at.toISOString() : new Date().toISOString(),
        user_name: 'Anonymous', // Default for public endpoint
        user_profile_image: null,
      }));
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  async findOne(id: string): Promise<ReviewWithUser> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user'],
      });
      
      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      
      return this.toReviewWithUser(review, review.user);
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
      const reviews = await this.reviewRepository.find({
        where: { user_id: parseInt(userId) },
        relations: ['user'],
        order: { created_at: 'DESC' },
      });

      return reviews.map(review => this.toReviewWithUser(review, review.user));
    } catch (error) {
      this.logger.error('Find reviews by user error:', error);
      throw new InternalServerErrorException('Failed to fetch user reviews');
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId?: string, isAdmin: boolean = false): Promise<ReviewWithUser> {
    try {
      const existingReview = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user'],
      });
      
      if (!existingReview) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      
      if (!isAdmin && userId && existingReview.user_id !== parseInt(userId)) {
        throw new BadRequestException('You can only update your own reviews');
      }

      if (updateReviewDto.rating !== undefined) {
        if (updateReviewDto.rating < 1 || updateReviewDto.rating > 5) {
          throw new BadRequestException('Rating must be between 1 and 5');
        }
      }

      let shouldUpdateTrainerRating = false;
      let approvalChanged = false;

      if (updateReviewDto.rating !== undefined && existingReview.is_approved) {
        shouldUpdateTrainerRating = true;
      }

      if (updateReviewDto.is_approved !== undefined && isAdmin) {
        approvalChanged = existingReview.is_approved !== updateReviewDto.is_approved;
        if (approvalChanged) {
          shouldUpdateTrainerRating = true;
        }
      }

      Object.assign(existingReview, {
        ...(updateReviewDto.rating !== undefined && { rating: updateReviewDto.rating }),
        ...(updateReviewDto.comment !== undefined && { comment: sanitizeText(updateReviewDto.comment) }),
        ...(updateReviewDto.reviewer_type !== undefined && { reviewer_type: updateReviewDto.reviewer_type ? sanitizeText(updateReviewDto.reviewer_type) : null }),
        ...(updateReviewDto.is_approved !== undefined && isAdmin && { is_approved: updateReviewDto.is_approved }),
      });

      const savedReview = await this.reviewRepository.save(existingReview);

      if (shouldUpdateTrainerRating && existingReview.booking_id) {
        try {
          const booking = await this.bookingRepository.findOne({
            where: { id: existingReview.booking_id },
            relations: ['service'],
          });
          
          // TODO: Implement trainer rating update when trainer_id is added to Service entity
          // if (booking?.service?.trainer_id) {
          //   await this.trainersService.updateTrainerRating(booking.service.trainer_id);
          // }
        } catch (error) {
          this.logger.warn('Failed to update trainer rating after review update:', error);
        }
      }
      
      return this.toReviewWithUser(savedReview, savedReview.user);
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
      const existingReview = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user'],
      });
      
      if (!existingReview) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      
      if (!isAdmin && userId && existingReview.user_id !== parseInt(userId)) {
        throw new BadRequestException('You can only delete your own reviews');
      }
      
      const wasApproved = existingReview.is_approved;
      const bookingId = existingReview.booking_id;

      await this.reviewRepository.remove(existingReview);
      
      if (wasApproved && bookingId) {
        try {
          const booking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: ['service'],
          });
          
          // TODO: Implement trainer rating update when trainer_id is added to Service entity
          // if (booking?.service?.trainer_id) {
          //   await this.trainersService.updateTrainerRating(booking.service.trainer_id);
          // }
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
      const reviews = await this.reviewRepository.find({
        where: { is_approved: false },
        relations: ['user'],
        order: { created_at: 'DESC' },
      });

      return reviews.map(review => this.toReviewWithUser(review, review.user));
    } catch (error) {
      this.logger.error('Get pending reviews error:', error);
      throw new InternalServerErrorException('Failed to fetch pending reviews');
    }
  }
}
