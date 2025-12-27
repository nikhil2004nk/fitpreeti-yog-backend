import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

export class HttpExceptionResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: string | string[] = 'Internal server error';
    let validationErrors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      errorMessage = (errorResponse as any).message || errorResponse;
      
      if (Array.isArray(errorMessage)) {
        validationErrors = errorMessage;
        errorMessage = 'Validation failed';
      }
    }

    const errorResponse: HttpExceptionResponse = {
      statusCode: status,
      error: HttpStatus[status],
      message: validationErrors.length > 0 ? validationErrors : errorMessage,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    console.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }
}
