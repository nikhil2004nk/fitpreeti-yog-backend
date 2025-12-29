import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import type { ClickHouseSettings } from '@clickhouse/client';

@Injectable()
export class ClickhouseService implements OnModuleInit, OnModuleDestroy {
  private client: ClickHouseClient;
  private database: string;
  private readonly logger = new Logger(ClickhouseService.name);

  constructor(private configService: ConfigService) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async onModuleInit() {
    const config = {
      url: this.configService.get('CLICKHOUSE_URL'),
      username: this.configService.get('CLICKHOUSE_USERNAME', 'default'),
      password: this.configService.get('CLICKHOUSE_PASSWORD'),
      database: this.database,
    };

    this.logger.log('Initializing ClickHouse client with config:', {
      ...config,
      password: config.password ? '***' : undefined
    });

    const clickhouseSettings: ClickHouseSettings = {
      async_insert: 1,
      wait_for_async_insert: 1,
      output_format_json_quote_64bit_integers: 0,
      connect_timeout: 30
    };

    this.client = createClient({
      url: config.url!,
      username: config.username,
      password: config.password,
      database: config.database,
      clickhouse_settings: clickhouseSettings,
      application: 'fitpreeti-yog-backend',
    });

    // Test connection
    try {
      const result = await this.client.query({
        query: 'SELECT 1 as test',
        format: 'JSONEachRow',
      });
      const data = await result.json();
      this.logger.log('✅ ClickHouse connection test successful:', data);
    } catch (error) {
      this.logger.error('❌ Failed to connect to ClickHouse:', error);
      throw new Error('Failed to connect to ClickHouse');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('🔌 ClickHouse connection closed');
    }
  }

  // Fixed: Proper DDL vs SELECT detection
  private isSelectQuery(query: string): boolean {
    const lowerQuery = query.trim().toLowerCase();
    return lowerQuery.startsWith('select');
  }

  async query<T = any>(query: string): Promise<T> {
    if (!this.client) {
      throw new Error('ClickHouse client is not initialized');
    }

    try {
      const formattedQuery = query.trim();
      const upperQuery = formattedQuery.toUpperCase();
      
      // For non-SELECT queries (DDL, INSERT, etc.)
      if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
        await this.client.exec({
          query: formattedQuery,
          clickhouse_settings: { wait_end_of_query: 1 },
        });
        return { success: true } as unknown as T;
      }
      
      // For SELECT queries, remove any FORMAT clause and use format parameter instead
      let finalQuery = formattedQuery.replace(/;*$/, '').trim();
      // Remove FORMAT clause if present (we'll use format option instead)
      finalQuery = finalQuery.replace(/\s+FORMAT\s+\w+/i, '').trim();
      
      this.logger.debug(`Executing: ${finalQuery.substring(0, 100)}${finalQuery.length > 100 ? '...' : ''}`);
      
      const result = await this.client.query({
        query: finalQuery,
        format: 'JSONEachRow',
        clickhouse_settings: {
          wait_end_of_query: 1,
          output_format_json_quote_64bit_integers: 0,
        },
      });

      // Only try to parse JSON for SELECT queries
      const data = await result.json<any[]>();
      return (Array.isArray(data) ? data : []) as unknown as T;
    } catch (error: any) {
      this.logger.error(`Query failed: ${query.substring(0, 100)}`, error.message);
      throw error;
    }
  }

  async insert(table: string, data: Record<string, any> | Record<string, any>[]) {
    if (!this.client) {
      throw new Error('ClickHouse client is not initialized');
    }

    try {
      const result = await this.client.insert({
        table: `${this.database}.${table}`,
        values: Array.isArray(data) ? data : [data],
        format: 'JSONEachRow',
      });
      return result;
    } catch (error) {
      this.logger.error(`Insert failed into ${table}:`, error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const result = await this.query<{ test: number }>('SELECT 1 as test');
      return result && (result as any)['test'] === 1;
    } catch (error) {
      this.logger.error('Connection check failed:', error);
      return false;
    }
  }
}
