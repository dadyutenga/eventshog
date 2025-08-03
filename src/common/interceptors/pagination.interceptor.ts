import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginationQueryDto, PaginationOptions } from '../dto/pagination.dto';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    // Extract pagination parameters
    const paginationOptions: PaginationOptions = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      skip: ((parseInt(query.page) || 1) - 1) * (parseInt(query.limit) || 10),
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: (query.sortOrder === 'asc' || query.sortOrder === 'desc') ? query.sortOrder : 'desc'
    };

    // Validate pagination parameters
    if (paginationOptions.page < 1) paginationOptions.page = 1;
    if (paginationOptions.limit < 1) paginationOptions.limit = 10;
    if (paginationOptions.limit > 100) paginationOptions.limit = 100;

    // Update skip calculation
    paginationOptions.skip = (paginationOptions.page - 1) * paginationOptions.limit;

    // Add pagination options to request
    request.paginationOptions = paginationOptions;

    return next.handle().pipe(
      map(data => {
        // If the response is already paginated, return as is
        if (data && data.meta && data.items) {
          return data;
        }

        // If it's an array, we assume it needs pagination
        if (Array.isArray(data)) {
          return {
            items: data,
            meta: {
              page: paginationOptions.page,
              limit: paginationOptions.limit,
              total: data.length,
              totalPages: Math.ceil(data.length / paginationOptions.limit),
              hasNextPage: paginationOptions.page < Math.ceil(data.length / paginationOptions.limit),
              hasPreviousPage: paginationOptions.page > 1,
              nextPage: paginationOptions.page < Math.ceil(data.length / paginationOptions.limit) ? paginationOptions.page + 1 : null,
              previousPage: paginationOptions.page > 1 ? paginationOptions.page - 1 : null
            },
            status: 'success',
            message: 'Data retrieved successfully'
          };
        }

        return data;
      })
    );
  }
} 