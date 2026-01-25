import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceOption } from '../services/entities/service-option.entity';
import { AppSetting } from '../app-settings/entities/app-setting.entity';
import { InstituteInfo as InstituteInfoEntity } from '../institute-info/entities/institute-info.entity';
import { Review } from '../reviews/entities/review.entity';
import { SeedService } from './seed.service';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Service, ServiceOption, AppSetting, InstituteInfoEntity, Review]),
  ],
  providers: [SeedService, BootstrapService],
  exports: [SeedService],
})
export class SeedModule {}
