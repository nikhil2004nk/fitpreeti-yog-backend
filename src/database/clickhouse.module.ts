import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClickhouseService } from './clickhouse.service';
import { SchemaService } from './schema.service';

@Module({
  imports: [ConfigModule],
  providers: [ClickhouseService, SchemaService],
  exports: [ClickhouseService],
})
export class ClickhouseModule {}
