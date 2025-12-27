import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ClickhouseModule, AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService]
})
export class BookingsModule {}
