import { Module } from '@nestjs/common';
import { InstituteInfoController } from './institute-info.controller';
import { InstituteInfoService } from './institute-info.service';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClickhouseModule,
    AuthModule,
  ],
  controllers: [InstituteInfoController],
  providers: [InstituteInfoService],
  exports: [InstituteInfoService],
})
export class InstituteInfoModule {}

