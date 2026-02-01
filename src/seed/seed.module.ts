import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceOption } from '../services/entities/service-option.entity';
import { InstituteInfo as InstituteInfoEntity } from '../institute-info/entities/institute-info.entity';
import { Review } from '../reviews/entities/review.entity';
import { Trainer } from '../trainers/entities/trainer.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { SeedService } from './seed.service';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Service, ServiceOption, InstituteInfoEntity, Review, Trainer, Customer, Schedule]),
  ],
  providers: [SeedService, BootstrapService],
  exports: [SeedService],
})
export class SeedModule {}
