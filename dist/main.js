"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookieParser = require('cookie-parser');
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT ?? 3000;
    app.use(cookieParser());
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Fitpreeti Yog Institute API')
        .setDescription('Booking system with role-based authentication')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    const baseUrl = `http://localhost:${port}`;
    const apiUrl = `${baseUrl}/api`;
    logger.log(`🚀 Application is running on: ${baseUrl}`);
    logger.log(`📚 API Documentation available at: ${apiUrl}`);
    logger.log(`🔐 Auth endpoints: ${baseUrl}/auth/*`);
    const clickhouseUrl = process.env.CLICKHOUSE_URL ||
        `https://${process.env.CLICKHOUSE_HOST || 'localhost'}:${process.env.CLICKHOUSE_PORT || '8443'}`;
    logger.log(`🗄️  ClickHouse Cloud connected: ${clickhouseUrl.replace(/:([^@]+)@/, ':***@')}`);
}
bootstrap().catch(err => {
    common_1.Logger.error('Error during application startup', err.stack, 'Bootstrap');
    process.exit(1);
});
//# sourceMappingURL=main.js.map