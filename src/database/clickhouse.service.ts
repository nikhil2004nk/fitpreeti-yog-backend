import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import type { ClickHouseSettings } from '@clickhouse/client';

interface UpdateOptions {
  table: string;
  setClause: string;
  whereClause: string;
  checkField?: string;
  expectedValue?: any;
  maxRetries?: number;
  retryDelayMs?: number;
}

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
      throw new ServiceUnavailableException('Failed to connect to ClickHouse database');
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

  /**
   * Execute a parameterized query to prevent SQL injection
   * @param query - SQL query with {param:type} placeholders
   * @param params - Object with parameter values
   * @returns Query results
   */
  async queryParams<T = any>(
    query: string,
    params: Record<string, string | number | boolean | null> = {},
  ): Promise<T> {
    if (!this.client) {
      throw new ServiceUnavailableException('Database service is not available');
    }

    try {
      const formattedQuery = query.trim();
      const upperQuery = formattedQuery.toUpperCase();
      
      // For non-SELECT queries (DDL, INSERT, etc.)
      if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
        await this.client.exec({
          query: formattedQuery,
          query_params: params,
          clickhouse_settings: { wait_end_of_query: 1 },
        });
        return { success: true } as unknown as T;
      }
      
      // For SELECT queries, remove any FORMAT clause and use format parameter instead
      let finalQuery = formattedQuery.replace(/;*$/, '').trim();
      finalQuery = finalQuery.replace(/\s+FORMAT\s+\w+/i, '').trim();
      
      this.logger.debug(`Executing parameterized query: ${finalQuery.substring(0, 100)}${finalQuery.length > 100 ? '...' : ''}`);
      
      const result = await this.client.query({
        query: finalQuery,
        query_params: params,
        format: 'JSONEachRow',
        clickhouse_settings: {
          wait_end_of_query: 1,
          output_format_json_quote_64bit_integers: 0,
        },
      });

      const data = await result.json<any[]>();
      return (Array.isArray(data) ? data : []) as unknown as T;
    } catch (error: any) {
      this.logger.error(`Parameterized query failed: ${query.substring(0, 100)}`, error.message);
      throw error;
    }
  }

  /**
   * @deprecated Use queryParams instead to prevent SQL injection
   * Legacy method for backward compatibility - will be removed in future version
   */
  async query<T = any>(query: string): Promise<T> {
    if (!this.client) {
      throw new ServiceUnavailableException('Database service is not available');
    }

    try {
      const formattedQuery = query.trim();
      const upperQuery = formattedQuery.toUpperCase();
      
      // For non-SELECT queries (DDL, INSERT, etc.)
      if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
        // Check if this is an ALTER TABLE UPDATE query
        if (upperQuery.startsWith('ALTER TABLE') && upperQuery.includes('UPDATE')) {
          // Extract table name, SET clause, and WHERE clause from the query
          const tableMatch = formattedQuery.match(/ALTER TABLE\s+([^\s]+)/i);
          const setMatch = formattedQuery.match(/UPDATE\s+(.+?)(?:\s+WHERE|$)/is);
          const whereMatch = formattedQuery.match(/WHERE\s+(.+?)(?:\s*;?\s*)$/is);
          
          if (tableMatch && setMatch) {
            const table = tableMatch[1];
            const setClause = setMatch[1].trim();
            const whereClause = whereMatch ? whereMatch[1].trim() : '1=1';
            
            // Try to extract a field to check for update verification
            const fieldMatch = setClause.match(/^(\w+)\s*=/);
            const checkField = fieldMatch ? fieldMatch[1] : undefined;
            
            // If we have a check field, extract its value for verification
            let expectedValue;
            if (checkField) {
              const valueMatch = setClause.match(new RegExp(`${checkField}\\s*=\\s*([^,]+)`));
              if (valueMatch) {
                expectedValue = valueMatch[1].trim().replace(/^'|'$/g, '');
              }
            }
            
            // Use the new updateWithConsistency method
            return this.updateWithConsistency({
              table,
              setClause,
              whereClause,
              checkField,
              expectedValue,
            }) as unknown as T;
          }
        }
        
        // For other non-SELECT queries, use the standard execution
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
      throw new ServiceUnavailableException('Database service is not available');
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

  /**
   * Execute an UPDATE query with eventual consistency handling
   * @param options Update options including table, setClause, and whereClause
   */
  async updateWithConsistency(options: UpdateOptions): Promise<{ success: boolean; updated: any }> {
    const {
      table,
      setClause,
      whereClause,
      checkField,
      expectedValue,
      maxRetries = 5,
      retryDelayMs = 100
    } = options;

    if (!this.client) {
      throw new ServiceUnavailableException('Database service is not available');
    }

    // Execute the update query
    const updateQuery = `ALTER TABLE ${table} UPDATE ${setClause} WHERE ${whereClause}`;
    await this.client.exec({
      query: updateQuery,
      clickhouse_settings: { wait_end_of_query: 1 },
    });

    // If no check field is provided, we can't verify the update, so just return success
    if (!checkField) {
      return { success: true, updated: null };
    }

    // Add a small delay to ensure the update is processed
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    
    // Retry mechanism to get the updated record
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Fetch the updated record with FINAL to get the latest version
        const selectQuery = `SELECT * FROM ${table} FINAL WHERE ${whereClause} LIMIT 1`;
        const result = await this.client.query({
          query: selectQuery,
          format: 'JSONEachRow',
        });
        
        const records = await result.json<any[]>();
        
        if (records && records.length > 0) {
          const updatedRecord = records[0];
          
          // If we have an expected value, verify the field was updated
          if (expectedValue !== undefined) {
            const actualValue = String(updatedRecord[checkField]);
            if (actualValue !== String(expectedValue)) {
              throw new InternalServerErrorException(`Field ${checkField} was not updated to ${expectedValue}, got ${actualValue}`);
            }
          }
          
          return { success: true, updated: updatedRecord };
        }
      } catch (error) {
        this.logger.warn(`Update verification attempt ${retries + 1} failed:`, error.message);
      }
      
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
    
    // If we get here, all retries failed
    throw new InternalServerErrorException(`Failed to verify update after ${maxRetries} attempts`);
  }
}
