import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ClickhouseService } from '../database/clickhouse.service';

@ApiTags('Health')
@Controller('health')
@SkipThrottle() // Health check should not be rate limited
export class HealthController {
  constructor(private ch: ClickhouseService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        database: { type: 'string', example: 'connected' },
        uptime: { type: 'number', example: 1234.56 }
      }
    }
  })
  async checkHealth() {
    const dbStatus = await this.ch.checkConnection();
    return {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    };
  }
}
