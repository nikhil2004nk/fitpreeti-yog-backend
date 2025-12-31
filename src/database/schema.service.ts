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
      // Users Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.users (
        id UUID DEFAULT generateUUIDv4(),
        name String,
        email String,
        phone String,
        pin String,
        role LowCardinality(String) DEFAULT 'customer',
        profile_image Nullable(String),
        is_active Boolean DEFAULT true,
        last_login Nullable(DateTime64(3)),
        refresh_token Nullable(String),
        refresh_token_expires_at Nullable(DateTime64(3)),
        created_at DateTime64(3) DEFAULT now64(),
        updated_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(updated_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (email, created_at)
      SETTINGS index_granularity = 8192`,
      
      // User Sessions Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.user_sessions (
        id UUID DEFAULT generateUUIDv4(),
        user_id UUID,
        token String,
        user_agent String,
        ip_address String,
        expires_at DateTime64(3),
        created_at DateTime64(3) DEFAULT now64()
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (user_id, token)
      TTL expires_at
      SETTINGS index_granularity = 8192`,

      // Trainers Table
`CREATE TABLE IF NOT EXISTS ${this.database}.trainers (
  id UUID DEFAULT generateUUIDv4(),
  name String,
  title Nullable(String),
  bio Nullable(String),
  specializations String,  // Changed from Array(String) to String to store JSON
  profile_image Nullable(String),
  rating Float64 DEFAULT 0.0,
  total_reviews UInt32 DEFAULT 0,
  availability String DEFAULT '{}',  // Changed from Nullable(String) to String with default
  certifications String,  // Changed from Array(String) to String to store JSON
  experience_years UInt8 DEFAULT 0,
  is_active Boolean DEFAULT true,
  social_media String DEFAULT '{}',  // Stores JSON object as string
  created_at DateTime64(3) DEFAULT now64(),
  updated_at DateTime64(3) DEFAULT now64()
) ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(created_at)
ORDER BY (id, created_at)
SETTINGS index_granularity = 8192`,

      // Services Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.services (
        id UUID DEFAULT generateUUIDv4(),
        service_name String,
        description String,
        price Float64,
        type LowCardinality(String),
        duration_minutes UInt32,
        trainer_id UUID,
        category LowCardinality(String),
        image_url Nullable(String),
        is_active Boolean DEFAULT true,
        created_at DateTime64(3) DEFAULT now64(),
        updated_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(updated_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (type, created_at)
      SETTINGS index_granularity = 8192`,
      
      // Class Schedules Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.class_schedules (
        id UUID DEFAULT generateUUIDv4(),
        title String,
        description Nullable(String),
        start_time DateTime64(3),
        end_time DateTime64(3),
        status LowCardinality(String) DEFAULT 'scheduled',
        max_participants UInt32,
        current_participants UInt32 DEFAULT 0,
        trainer_id UUID,
        service_id UUID,
        is_recurring Boolean DEFAULT false,
        recurrence_pattern Nullable(String),
        recurrence_end_date Nullable(DateTime64(3)),
        created_at DateTime64(3) DEFAULT now64(),
        updated_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(updated_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (start_time, status)
      SETTINGS index_granularity = 8192`,
      
      // Bookings Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.bookings (
        id UUID DEFAULT generateUUIDv4(),
        user_id UUID,
        user_phone String DEFAULT '',
        service_id UUID,
        booking_date Date,
        booking_time String,
        full_name String DEFAULT '',
        email String DEFAULT '',
        phone String DEFAULT '',
        special_requests Nullable(String),
        status LowCardinality(String) DEFAULT 'pending',
        start_time DateTime64(3),
        end_time DateTime64(3),
        notes Nullable(String),
        amount Float64,
        payment_status LowCardinality(String) DEFAULT 'pending',
        payment_id Nullable(String),
        created_at DateTime64(3) DEFAULT now64(),
        updated_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(updated_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (user_id, service_id, booking_date, booking_time)
      SETTINGS index_granularity = 8192`,
      
      // Payments Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.payments (
        id UUID DEFAULT generateUUIDv4(),
        user_id UUID,
        booking_id UUID,
        amount Float64,
        currency String DEFAULT 'INR',
        status LowCardinality(String) DEFAULT 'pending',
        payment_method LowCardinality(String),
        transaction_id Nullable(String),
        receipt_url Nullable(String),
        created_at DateTime64(3) DEFAULT now64(),
        updated_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(updated_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (user_id, booking_id, created_at)
      SETTINGS index_granularity = 8192`,
      
      // Reviews Table
      `CREATE TABLE IF NOT EXISTS ${this.database}.reviews (
        id UUID DEFAULT generateUUIDv4(),
        user_id UUID,
        booking_id Nullable(UUID),
        rating UInt8,
        comment String,
        reviewer_type Nullable(String),
        is_approved Boolean DEFAULT false,
        created_at DateTime64(3) DEFAULT now64(),
        updated_at DateTime64(3) DEFAULT now64()
      ) ENGINE = ReplacingMergeTree(updated_at)
      PARTITION BY toYYYYMM(created_at)
      ORDER BY (user_id, created_at)
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

    // Add title column to trainers table if it doesn't exist (for existing databases)
    try {
      // Check if column exists by querying table structure
      const checkQuery = `SELECT name FROM system.columns WHERE database = '${this.database}' AND table = 'trainers' AND name = 'title'`;
      const columnExists = await this.ch.query(checkQuery);
      
      // If column doesn't exist, add it
      if (!columnExists || (Array.isArray(columnExists) && columnExists.length === 0)) {
        await this.ch.query(`ALTER TABLE ${this.database}.trainers ADD COLUMN title Nullable(String)`);
        this.logger.log(`✅ Added title column to trainers table`);
      } else {
        this.logger.log(`✅ Title column already exists in trainers table`);
      }
    } catch (error: any) {
      // Column might already exist or table might not exist yet, which is fine
      this.logger.warn(`⚠️ Could not add title column to trainers: ${error.message}`);
    }
  }
}
