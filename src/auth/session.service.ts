import { Injectable, Logger } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly database: string;

  constructor(
    private readonly ch: ClickhouseService,
    private readonly configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  async createSession(
    userId: string,
    token: string,
    userAgent: string,
    ipAddress: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await this.ch.query(`
        INSERT INTO ${this.database}.user_sessions 
        (user_id, token, user_agent, ip_address, expires_at)
        VALUES 
        ('${userId}', '${this.escapeSqlString(token)}', 
         '${this.escapeSqlString(userAgent)}', 
         '${this.escapeSqlString(ipAddress)}',
         '${expiresAt.toISOString().replace('T', ' ').replace('Z', '')}')
      `);
    } catch (error) {
      this.logger.error('Failed to create session', error.stack);
      throw error;
    }
  }

  async validateSession(userId: string, token: string): Promise<boolean> {
    try {
      const result = await this.ch.query<Array<{ count: number }>>(`
        SELECT count() as count 
        FROM ${this.database}.user_sessions 
        WHERE user_id = '${userId}' 
        AND token = '${this.escapeSqlString(token)}'
        AND expires_at > now()
      `);
      
      return result?.[0]?.count > 0;
    } catch (error) {
      this.logger.error('Failed to validate session', error.stack);
      return false;
    }
  }

  async invalidateSession(token: string): Promise<void> {
    try {
      await this.ch.query(`
        ALTER TABLE ${this.database}.user_sessions 
        DELETE WHERE token = '${this.escapeSqlString(token)}'
      `);
    } catch (error) {
      this.logger.error('Failed to invalidate session', error.stack);
      throw error;
    }
  }

  async invalidateAllUserSessions(userId: string, excludeToken?: string): Promise<void> {
    try {
      let query = `
        ALTER TABLE ${this.database}.user_sessions 
        DELETE WHERE user_id = '${userId}'
      `;
      
      if (excludeToken) {
        query += ` AND token != '${this.escapeSqlString(excludeToken)}'`;
      }
      
      await this.ch.query(query);
    } catch (error) {
      this.logger.error('Failed to invalidate user sessions', error.stack);
      throw error;
    }
  }

  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }
}
