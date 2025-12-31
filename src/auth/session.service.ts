import { Injectable, Logger } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { sanitizeText } from '../common/utils/sanitize.util';

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
      const sessionData = {
        user_id: userId,
        token: sanitizeText(token),
        user_agent: sanitizeText(userAgent),
        ip_address: sanitizeText(ipAddress),
        expires_at: expiresAt.toISOString(),
      };

      await this.ch.insert('user_sessions', sessionData);
    } catch (error) {
      this.logger.error('Failed to create session', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async validateSession(userId: string, token: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM ${this.database}.user_sessions 
        WHERE user_id = {userId:String} 
          AND token = {token:String}
          AND expires_at > now()
      `;
      const result = await this.ch.queryParams<Array<{ count: number }>>(query, { 
        userId, 
        token: sanitizeText(token) 
      });
      
      return result?.[0]?.count > 0;
    } catch (error) {
      this.logger.error('Failed to validate session', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  async invalidateSession(token: string): Promise<void> {
    try {
      const deleteQuery = `
        ALTER TABLE ${this.database}.user_sessions 
        DELETE WHERE token = {token:String}
      `;
      await this.ch.queryParams(deleteQuery, { token: sanitizeText(token) });
    } catch (error) {
      this.logger.error('Failed to invalidate session', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async invalidateAllUserSessions(userId: string, excludeToken?: string): Promise<void> {
    try {
      if (excludeToken) {
        const deleteQuery = `
          ALTER TABLE ${this.database}.user_sessions 
          DELETE WHERE user_id = {userId:String} AND token != {excludeToken:String}
        `;
        await this.ch.queryParams(deleteQuery, { 
          userId, 
          excludeToken: sanitizeText(excludeToken) 
        });
      } else {
        const deleteQuery = `
          ALTER TABLE ${this.database}.user_sessions 
          DELETE WHERE user_id = {userId:String}
        `;
        await this.ch.queryParams(deleteQuery, { userId });
      }
    } catch (error) {
      this.logger.error('Failed to invalidate user sessions', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
