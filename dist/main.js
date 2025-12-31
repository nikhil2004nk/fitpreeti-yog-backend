"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const nodeEnv = configService.get('NODE_ENV', 'development');
    const apiPrefix = configService.get('API_PREFIX', '/api/v1');
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: nodeEnv === 'production',
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, cookie_parser_1.default)());
    const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:3001');
    const allowedOrigins = nodeEnv === 'production'
        ? [frontendUrl]
        : [
            frontendUrl,
            'http://localhost:3001',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            'http://localhost:5178'
        ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            if (nodeEnv !== 'production' && origin.startsWith('http://localhost:')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const messages = errors.map(error => Object.values(error.constraints || {}).join(', '));
            return new common_1.BadRequestException(messages);
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Fitpreeti Yog Institute API')
        .setDescription('Booking system with role-based authentication')
        .setVersion('1.0')
        .addBearerAuth()
        .addCookieAuth('access_token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    const baseUrl = `http://localhost:${port}`;
    const apiUrl = `${baseUrl}${apiPrefix}`;
    logger.log(`🚀 Application is running on: ${baseUrl}`);
    logger.log(`📚 API Documentation available at: ${baseUrl}/api`);
    logger.log(`🔐 API endpoints: ${apiUrl}/*`);
    logger.log(`🌍 Environment: ${nodeEnv}`);
    const clickhouseUrl = configService.get('CLICKHOUSE_URL') ||
        `https://${configService.get('CLICKHOUSE_HOST', 'localhost')}:${configService.get('CLICKHOUSE_PORT', '8443')}`;
    logger.log(`🗄️  ClickHouse connected: ${clickhouseUrl.replace(/:([^@]+)@/, ':***@')}`);
}
bootstrap().catch(err => {
    common_1.Logger.error('Error during application startup', err instanceof Error ? err.stack : String(err), 'Bootstrap');
    process.exit(1);
});
//# sourceMappingURL=main.js.map