import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Skip wrapping if response is already in the correct format
        if (data && typeof data === 'object' && 'success' in data && 'message' in data && 'data' in data) {
          return data as ApiSuccessResponse<T>;
        }
        
        // Skip wrapping for null/undefined responses (e.g., DELETE 204)
        if (data === null || data === undefined) {
          return data as any;
        }
        
        // Wrap plain data in success response
        return new ApiSuccessResponse(data, 'Operation successful');
      }),
    );
  }
}

