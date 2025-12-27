import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ClickhouseModule } from '../database/clickhouse.module';

@Module({
  imports: [ClickhouseModule],
  controllers: [HealthController],
})
export class HealthModule {}
