import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ServiceCategory } from '../service-categories/entities/service-category.entity';
import { Service } from '../services/entities/service.entity';
import { AppSetting } from '../app-settings/entities/app-setting.entity';
import { SeedService } from './seed.service';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ServiceCategory, Service, AppSetting]),
  ],
  providers: [SeedService, BootstrapService],
  exports: [SeedService],
})
export class SeedModule {}
