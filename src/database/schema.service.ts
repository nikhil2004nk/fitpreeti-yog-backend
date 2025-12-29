import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from './clickhouse.service';

@Injectable()
export class SchemaService implements OnModuleInit {
  private readonly logger = new Logger(SchemaService.name);
  private readonly database: string;

  constructor(
    private readonly ch: ClickhouseService,
    private readonly configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async onModuleInit() {
    try {
      await this.initDatabase();
      // Tables are created with IF NOT EXISTS - no dropping, data is preserved
      await this.initTables();
      this.logger.log('✅ Database schema initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize database schema', error);
      throw error;
    }
  }

  private async initDatabase() {
    await this.ch.query(`CREATE DATABASE IF NOT EXISTS ${this.database}`);
    this.logger.log(`🗄️ Using database: ${this.database}`);
  }


  private async initTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS ${this.database}.users (
        id UUID DEFAULT generateUUIDv4(),
        name String,
        email String,
        phone String,
        pin String,
        role LowCardinality(String) DEFAULT 'customer',
        created_at DateTime64(3) DEFAULT now64()
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (phone, created_at)
      SETTINGS index_granularity = 8192`,

      `CREATE TABLE IF NOT EXISTS ${this.database}.services (
        id UUID DEFAULT generateUUIDv4(),
        service_type LowCardinality(String),
        service_name LowCardinality(String),
        description String,
        price Float64,
        duration UInt32,
        created_at DateTime64(3) DEFAULT now64()
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (service_type, created_at)
      SETTINGS index_granularity = 8192`,

      `CREATE TABLE IF NOT EXISTS ${this.database}.bookings (
        id UUID DEFAULT generateUUIDv4(),
        user_id UUID,
        user_phone String,
        service_id UUID,
        booking_date Date,
        booking_time String,
        special_requests String,
        full_name String,
        email String,
        phone String,
        status LowCardinality(String) DEFAULT 'pending',
        created_at DateTime64(3) DEFAULT now64()
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(booking_date)
      ORDER BY (user_id, booking_date, booking_time)
      SETTINGS index_granularity = 8192`,

      `CREATE TABLE IF NOT EXISTS ${this.database}.refresh_tokens (
        id UInt64 MATERIALIZED rand64(),
        phone String,
        token String,
        expires_at DateTime64(3),
        created_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(created_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (phone, token)
      TTL expires_at
      SETTINGS index_granularity = 8192`
    ];

    for (const [index, query] of tables.entries()) {
      try {
        await this.ch.query(query);
        const tableName = query.match(/\.(\w+)/)?.[1] || `table-${index}`;
        this.logger.log(`✅ Table checked/created: ${this.database}.${tableName} (IF NOT EXISTS)`);
      } catch (error: any) {
        this.logger.error(`❌ Failed to create table ${index + 1}: ${error.message}`);
        throw error;
      }
    }
  }
}
