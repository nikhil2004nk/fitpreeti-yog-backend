import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  
  // Security: Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
  }));
  
  // Middleware
  app.use(cookieParser());
  
  // CORS configuration
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const allowedOrigins = nodeEnv === 'production' 
    ? [frontendUrl] 
    : [frontendUrl, 'http://localhost:3001', 'http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Global API prefix
  app.setGlobalPrefix(apiPrefix);
  
  // Global pipes, filters, and interceptors
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      const messages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      return new BadRequestException(messages);
    },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Fitpreeti Yog Institute API')
    .setDescription('Booking system with role-based authentication')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(port);
  
  const logger = new Logger('Bootstrap');
  const baseUrl = `http://localhost:${port}`;
  const apiUrl = `${baseUrl}${apiPrefix}`;
  
  logger.log(`🚀 Application is running on: ${baseUrl}`);
  logger.log(`📚 API Documentation available at: ${baseUrl}/api`);
  logger.log(`🔐 API endpoints: ${apiUrl}/*`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  
  // ClickHouse connection info (masked password)
  const clickhouseUrl = configService.get<string>('CLICKHOUSE_URL') || 
    `https://${configService.get<string>('CLICKHOUSE_HOST', 'localhost')}:${configService.get<string>('CLICKHOUSE_PORT', '8443')}`;
  logger.log(`🗄️  ClickHouse connected: ${clickhouseUrl.replace(/:([^@]+)@/, ':***@')}`);
}

bootstrap().catch(err => {
  Logger.error('Error during application startup', err instanceof Error ? err.stack : String(err), 'Bootstrap');
  process.exit(1);
});
