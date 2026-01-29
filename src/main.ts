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
  
  // CORS configuration: support CORS_ORIGIN (comma-separated) and FRONTEND_URL
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN', '');
  const corsOriginList = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const productionOrigins = [
    frontendUrl,
    ...corsOriginList,
    'https://fitpreetiyoginstitute.com',
    'https://www.fitpreetiyoginstitute.com',
  ];
  const devOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
  ];
  const allowedOrigins = nodeEnv === 'production'
    ? [...new Set(productionOrigins)]
    : [...new Set([...productionOrigins, ...devOrigins])];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or when proxied)
      if (!origin) {
        return callback(null, true);
      }
      // Allow production domain (with or without www, with or without trailing slash)
      const normalized = origin.replace(/\/$/, '');
      if (normalized === 'https://fitpreetiyoginstitute.com' || normalized === 'https://www.fitpreetiyoginstitute.com') {
        return callback(null, true);
      }
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In development, also allow any localhost origin (for flexibility)
      if (nodeEnv !== 'production' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'], // Expose Set-Cookie header for cross-origin cookies
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
  
  // MySQL connection info
  const dbHost = configService.get<string>('DB_HOST', 'localhost');
  const dbPort = configService.get<number>('DB_PORT', 3306);
  const dbName = configService.get<string>('DB_NAME', 'fitpreeti_dev');
  logger.log(`🗄️  MySQL Database: ${dbHost}:${dbPort}/${dbName}`);
}

bootstrap().catch(err => {
  Logger.error('Error during application startup', err instanceof Error ? err.stack : String(err), 'Bootstrap');
  process.exit(1);
});
