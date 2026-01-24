import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserSession } from './entities/user-session.entity';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  async createSession(
    userId: number,
    token: string,
    userAgent: string,
    ipAddress: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      const session = this.sessionRepository.create({
        user_id: userId,
        token: sanitizeText(token),
        user_agent: sanitizeText(userAgent),
        ip_address: sanitizeText(ipAddress),
        expires_at: expiresAt,
      });

      await this.sessionRepository.save(session);
    } catch (error) {
      this.logger.error('Failed to create session', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async findSessionByToken(token: string): Promise<{ user_id: number } | null> {
    try {
      const session = await this.sessionRepository.findOne({
        where: {
          token: sanitizeText(token),
          expires_at: MoreThan(new Date()),
        },
        select: ['user_id'],
      });
      return session ? { user_id: session.user_id } : null;
    } catch (error) {
      this.logger.error('Failed to find session by token', error instanceof Error ? error.stack : String(error));
      return null;
    }
  }

  async validateSession(userId: number, token: string): Promise<boolean> {
    try {
      const count = await this.sessionRepository.count({
        where: {
          user_id: userId,
          token: sanitizeText(token),
          expires_at: MoreThan(new Date()),
        },
      });

      return count > 0;
    } catch (error) {
      this.logger.error('Failed to validate session', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  async invalidateSession(token: string): Promise<void> {
    try {
      await this.sessionRepository.delete({ token: sanitizeText(token) });
    } catch (error) {
      this.logger.error('Failed to invalidate session', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async invalidateAllUserSessions(userId: number, excludeToken?: string): Promise<void> {
    try {
      const qb = this.sessionRepository.createQueryBuilder().delete().where('user_id = :userId', { userId });
      if (excludeToken) {
        qb.andWhere('token != :excludeToken', { excludeToken: sanitizeText(excludeToken) });
      }
      await qb.execute();
    } catch (error) {
      this.logger.error('Failed to invalidate user sessions', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
