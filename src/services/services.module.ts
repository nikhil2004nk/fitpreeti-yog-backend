import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesPublicController } from './services-public.controller';
import { ServicesAdminController } from './services-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    AuthModule,
  ],
  providers: [ServicesService],
  controllers: [ServicesPublicController, ServicesAdminController],
  exports: [ServicesService],
})
export class ServicesModule {}
