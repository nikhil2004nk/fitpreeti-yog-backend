import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoriesPublicController } from './service-categories.controller';
import { ServiceCategoriesAdminController } from './service-categories-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCategory]),
    AuthModule,
  ],
  providers: [ServiceCategoriesService],
  controllers: [ServiceCategoriesPublicController, ServiceCategoriesAdminController],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
