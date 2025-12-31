import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isDevelopment: boolean;

  constructor(private readonly configService?: ConfigService) {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: string | string[] = 'Internal server error';
    let validationErrors: string[] = [];
    let errorType = 'Internal Server Error';

    // Handle ThrottlerException specifically (rate limiting)
    // ThrottlerException extends HttpException, but we handle it explicitly for clarity
    if (exception instanceof ThrottlerException || (exception instanceof HttpException && exception.getStatus() === HttpStatus.TOO_MANY_REQUESTS)) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      errorMessage = 'Too many requests. Please try again later.';
      errorType = 'Too Many Requests';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      
      // Handle different error response formats
      if (typeof errorResponse === 'string') {
        errorMessage = errorResponse;
        errorType = this.getErrorTypeName(status);
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const errorObj = errorResponse as any;
        errorMessage = errorObj.message || errorResponse;
        errorType = errorObj.error || this.getErrorTypeName(status);
      } else {
        errorMessage = String(errorResponse);
        errorType = this.getErrorTypeName(status);
      }
      
      // Handle validation errors (array of messages)
      if (Array.isArray(errorMessage)) {
        validationErrors = errorMessage;
        errorMessage = 'Validation failed';
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message || 'Internal server error';
      errorType = 'Internal Server Error';
      this.logger.error('Unhandled error', exception.stack);
    } else {
      errorMessage = 'An unexpected error occurred';
      errorType = 'Internal Server Error';
      this.logger.error('Unknown error type', JSON.stringify(exception));
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error: errorType,
      message: validationErrors.length > 0 ? validationErrors : errorMessage,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    // Log error with context (only stack trace in development)
    const logData: any = {
      ...errorResponse,
      ...(this.isDevelopment && exception instanceof Error ? { stack: exception.stack } : {}),
    };
    
    if (status >= 500) {
      this.logger.error(`[${status}] ${errorType}: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`, logData);
    } else if (status >= 400) {
      this.logger.warn(`[${status}] ${errorType}: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`, logData);
    }

    response.status(status).json(errorResponse);
  }

  private getErrorTypeName(status: number): string {
    const statusNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      406: 'Not Acceptable',
      409: 'Conflict',
      410: 'Gone',
      411: 'Length Required',
      412: 'Precondition Failed',
      413: 'Payload Too Large',
      414: 'URI Too Long',
      415: 'Unsupported Media Type',
      416: 'Range Not Satisfiable',
      417: 'Expectation Failed',
      418: "I'm a teapot",
      422: 'Unprocessable Entity',
      423: 'Locked',
      424: 'Failed Dependency',
      425: 'Too Early',
      426: 'Upgrade Required',
      428: 'Precondition Required',
      429: 'Too Many Requests',
      431: 'Request Header Fields Too Large',
      451: 'Unavailable For Legal Reasons',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
      505: 'HTTP Version Not Supported',
      506: 'Variant Also Negotiates',
      507: 'Insufficient Storage',
      508: 'Loop Detected',
      510: 'Not Extended',
      511: 'Network Authentication Required',
    };

    return statusNames[status] || HttpStatus[status] || 'Error';
  }
}
