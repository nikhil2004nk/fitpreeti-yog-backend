"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SchemaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const clickhouse_service_1 = require("./clickhouse.service");
let SchemaService = SchemaService_1 = class SchemaService {
    ch;
    configService;
    logger = new common_1.Logger(SchemaService_1.name);
    database;
    constructor(ch, configService) {
        this.ch = ch;
        this.configService = configService;
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    }
    async onModuleInit() {
        try {
            await this.initDatabase();
            await this.initTables();
            this.logger.log('✅ Database schema initialized successfully');
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize database schema', error);
            throw error;
        }
    }
    async initDatabase() {
        await this.ch.query(`CREATE DATABASE IF NOT EXISTS ${this.database}`);
        this.logger.log(`🗄️ Using database: ${this.database}`);
    }
    async initTables() {
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
            }
            catch (error) {
                this.logger.error(`❌ Failed to create table ${index + 1}: ${error.message}`);
                throw error;
            }
        }
    }
};
exports.SchemaService = SchemaService;
exports.SchemaService = SchemaService = SchemaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService,
        config_1.ConfigService])
], SchemaService);
//# sourceMappingURL=schema.service.js.map