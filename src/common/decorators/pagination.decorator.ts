import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { PaginationInterceptor } from '../interceptors/pagination.interceptor';

export function Paginated() {
  return applyDecorators(
    UseInterceptors(PaginationInterceptor),
    ApiQuery({ name: 'page', required: false, description: 'Page number (starts from 1)', example: 1 }),
    ApiQuery({ name: 'limit', required: false, description: 'Number of items per page (max 100)', example: 10 }),
    ApiQuery({ name: 'search', required: false, description: 'Search term for filtering results', example: 'rent' }),
    ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', example: 'createdAt' }),
    ApiQuery({ 
      name: 'sortOrder', 
      required: false, 
      description: 'Sort order', 
      enum: ['asc', 'desc'],
      example: 'desc'
    })
  );
} 