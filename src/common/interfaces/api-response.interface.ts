import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponse<T> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  constructor(data: T, message: string = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class ApiErrorResponse {
  @ApiProperty({ description: 'Indicates if the request was successful', example: false })
  success: boolean;

  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Error type', example: 'Bad Request' })
  error: string;

  @ApiProperty({ description: 'Error message or array of validation errors' })
  message: string | string[];

  @ApiProperty({ description: 'Request path', example: '/api/v1/services' })
  path: string;

  @ApiProperty({ description: 'HTTP method', example: 'POST' })
  method: string;

  @ApiProperty({ description: 'Timestamp of the error' })
  timestamp: string;
}

export class ApiPaginatedResponse<T> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Array of data items' })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;
}

