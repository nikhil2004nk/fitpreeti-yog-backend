import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
const cookieParser = require('cookie-parser');
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  
  // Middleware
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });
  
  // Global pipes and filters
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Fitpreeti Yog Institute API')
    .setDescription('Booking system with role-based authentication')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(port);
  
  const logger = new Logger('Bootstrap');
  const baseUrl = `http://localhost:${port}`;
  const apiUrl = `${baseUrl}/api`;
  
  logger.log(`🚀 Application is running on: ${baseUrl}`);
  logger.log(`📚 API Documentation available at: ${apiUrl}`);
  logger.log(`🔐 Auth endpoints: ${baseUrl}/auth/*`);
  
  // ClickHouse connection info (masked password)
  const clickhouseUrl = process.env.CLICKHOUSE_URL || 
    `https://${process.env.CLICKHOUSE_HOST || 'localhost'}:${process.env.CLICKHOUSE_PORT || '8443'}`;
  logger.log(`🗄️  ClickHouse Cloud connected: ${clickhouseUrl.replace(/:([^@]+)@/, ':***@')}`);
}

bootstrap().catch(err => {
  Logger.error('Error during application startup', err.stack, 'Bootstrap');
  process.exit(1);
});
