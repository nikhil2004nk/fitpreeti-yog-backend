import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstituteInfo } from './entities/institute-info.entity';
import { InstituteInfoController } from './institute-info.controller';
import { InstituteInfoService } from './institute-info.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstituteInfo]),
    AuthModule,
  ],
  controllers: [InstituteInfoController],
  providers: [InstituteInfoService],
  exports: [InstituteInfoService],
})
export class InstituteInfoModule {}

