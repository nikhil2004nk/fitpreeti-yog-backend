import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class HttpExceptionResponse {
    statusCode: number;
    error: string;
    message: string | string[];
    path: string;
    method: string;
    timestamp: string;
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
