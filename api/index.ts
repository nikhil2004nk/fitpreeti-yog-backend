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
let cachedNestApp: any; // Store NestJS app instance for graceful shutdown

async function createApp(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  
  // Store NestJS app instance for graceful shutdown
  cachedNestApp = app;

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'production');
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'https://fitpreetiyoginstitute.com');
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN', '');
  const corsOriginList = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  // Security: Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
  }));

  // Middleware
  app.use(cookieParser());

  // CORS configuration: support CORS_ORIGIN (comma-separated) and production domain
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
      if (allowedOrigins.includes(origin)) {
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
  logger.log(`🚀 Application initialized`);
  logger.log(`🌍 Environment: ${nodeEnv}`);

  return expressApp;
}

// Serverless / standalone request handler
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

// Standalone server mode for Docker/production
if (require.main === module) {
  const logger = new Logger('Bootstrap');
  
  createApp()
    .then(async (expressApp) => {
      const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
      
      // Start the server
      const server = expressApp.listen(port, '0.0.0.0', () => {
        logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
        logger.log(`📚 API Documentation available at: http://0.0.0.0:${port}/api`);
        logger.log(`🔐 API endpoints: http://0.0.0.0:${port}/api/v1/*`);
        logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      });

      // Graceful shutdown
      const shutdown = async (signal: string) => {
        logger.log(`Received ${signal}, shutting down gracefully...`);
        
        // Close HTTP server
        server.close(async () => {
          logger.log('HTTP server closed');
          
          // Close NestJS app if available
          if (cachedNestApp) {
            try {
              await cachedNestApp.close();
              logger.log('NestJS application closed');
            } catch (err) {
              logger.error('Error closing NestJS app', err);
            }
          }
          
          process.exit(0);
        });
        
        // Force close after 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      logger.error('Error during application startup', err instanceof Error ? err.stack : String(err));
      process.exit(1);
    });
}

