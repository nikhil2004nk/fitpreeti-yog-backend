import { Module, forwardRef } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';
import { TrainersModule } from '../trainers/trainers.module';

@Module({
  imports: [
    ClickhouseModule,
    AuthModule, // Provides JwtModule and guards
    forwardRef(() => TrainersModule), // Forward ref to avoid circular dependency
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

