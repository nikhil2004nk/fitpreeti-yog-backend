import { Controller, Get } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';

@Controller('health')
export class HealthController {
  constructor(private ch: ClickhouseService) {}

  @Get()
  async checkHealth() {
    const dbStatus = await this.ch.checkConnection();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    };
  }
}
