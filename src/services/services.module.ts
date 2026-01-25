import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceOption } from './entities/service-option.entity';
import { ServicesService } from './services.service';
import { ServiceOptionsService } from './service-options.service';
import { ServicesPublicController } from './services-public.controller';
import { ServicesAdminController } from './services-admin.controller';
import { ServiceOptionsAdminController } from './service-options-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceOption]),
    AuthModule,
  ],
  providers: [ServicesService, ServiceOptionsService],
  controllers: [
    ServicesPublicController,
    ServicesAdminController,
    ServiceOptionsAdminController,
  ],
  exports: [ServicesService, ServiceOptionsService],
})
export class ServicesModule {}
