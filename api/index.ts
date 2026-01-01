import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

let cachedApp: express.Application;

async function createApp(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'production');
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'https://your-frontend-url.vercel.app');

  // Security: Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
  }));

  // Middleware
  app.use(cookieParser());

  // CORS configuration for Vercel
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // In production, allow frontend URL and Vercel preview URLs
      const allowedOrigins = [
        frontendUrl,
        'https://nikhil2004nk.github.io', // GitHub Pages frontend
        ...(nodeEnv === 'production' ? [] : [
          'http://localhost:3001',
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:5176',
          'http://localhost:5177',
          'http://localhost:5178',
        ]),
      ];

      // Allow Vercel preview URLs
      if (origin.includes('.vercel.app') || origin.includes('.vercel.dev')) {
        return callback(null, true);
      }

      // Allow GitHub Pages URLs
      if (origin.includes('.github.io')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Global pipes, filters, and interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints || {}).join(', '),
        );
        return new BadRequestException(messages);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation (only in non-production or if needed)
  if (nodeEnv !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Fitpreeti Yog Institute API')
      .setDescription('Booking system with role-based authentication')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.init();
  cachedApp = expressApp;

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application initialized for Vercel`);
  logger.log(`🌍 Environment: ${nodeEnv}`);

  return expressApp;
}

export default async function handler(req: express.Request, res: express.Response) {
  // Handle root path with helpful information
  const path = req.url?.split('?')[0] || req.path || '/';
  if (path === '/' || path === '') {
    return res.status(200).json({
      success: true,
      message: 'Fitpreeti Yog Institute API',
      version: '1.0',
      endpoints: {
        health: '/api/v1/health',
        api: '/api/v1',
        docs: '/api',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const app = await createApp();
  return app(req, res);
}

