import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly configService?;
    private readonly logger;
    private readonly isDevelopment;
    constructor(configService?: ConfigService | undefined);
    catch(exception: unknown, host: ArgumentsHost): void;
    private getErrorTypeName;
}
