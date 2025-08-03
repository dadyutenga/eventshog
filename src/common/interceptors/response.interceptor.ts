import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        this.logger.log(`[ResponseInterceptor] Received data type: ${typeof data}`);
        this.logger.log(`[ResponseInterceptor] Is array? ${Array.isArray(data)}`);
        this.logger.log(`[ResponseInterceptor] Data: ${JSON.stringify(data)}`);

        // If data is already in the expected response format, return it as is
        if (data && typeof data === 'object' && 'status' in data && 'message' in data) {
          this.logger.log(`[ResponseInterceptor] Data already has response format, returning as is`);
          return data;
        }

        // If data has items and total (from service), wrap it in the response format with pagination
        if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
          this.logger.log(`[ResponseInterceptor] Data has items and total, wrapping in response format`);
          const request = context.switchToHttp().getRequest();
          const page = Number(request.query.page) || 1;
          const limit = Number(request.query.limit) || 10;
          const total = data.total;
          const total_pages = Math.ceil(total / limit);
          
          return {
            status: 'success',
            message: 'Operation successful',
            data: data.items,
            meta: {
              total: total,
              page: page,
              limit: limit,
              total_pages: total_pages,
              hasNext: page < total_pages
            }
          };
        }

        // If data is an array, wrap it in the response format
        if (Array.isArray(data)) {
          this.logger.log(`[ResponseInterceptor] Data is array, wrapping in response format`);
          return {
            status: 'success',
            message: 'Operation successful',
            data: data
          };
        }

        // If data has success and message properties, use them
        if (data && typeof data === 'object' && 'success' in data && 'message' in data) {
          this.logger.log('[ResponseInterceptor] Data has success and message properties');
          return {
            status: data.success ? 'success' : 'error',
            message: data.message,
            data: data.data || null
          };
        }

        // For any other case, wrap the data in the response format
        this.logger.log(`[ResponseInterceptor] Wrapping data in response format`);
        return {
          status: 'success',
          message: 'Operation successful',
          data: data
        };
      }),
    );
  }
}