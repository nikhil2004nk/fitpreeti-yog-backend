import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuthModule } from '../auth/auth.module';
import { TrainersModule } from '../trainers/trainers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, User]),
    AuthModule, // Provides JwtModule and guards
    forwardRef(() => TrainersModule), // Forward ref to avoid circular dependency
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

