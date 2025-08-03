import { Injectable } from '@nestjs/common';
import { PaginationOptions, PaginatedResponseDto } from '../dto/pagination.dto';
import { PaginatedRepository } from '../repository/paginated.repository';
import { ObjectLiteral } from 'typeorm';

@Injectable()
export abstract class PaginatedService<T extends ObjectLiteral> {
  constructor(protected readonly repository: PaginatedRepository<T>) {}

  async findAllPaginated(
    options: PaginationOptions,
    additionalWhere?: any,
    relations?: string[]
  ): Promise<PaginatedResponseDto<T>> {
    return this.repository.findPaginated(options, additionalWhere, relations);
  }

  async findAllPaginatedWithOptions(
    options: PaginationOptions,
    findOptions?: any
  ): Promise<PaginatedResponseDto<T>> {
    return this.repository.findPaginatedWithOptions(options, findOptions);
  }

  public getPaginationOptionsFromRequest(request: any): PaginationOptions {
    return request.paginationOptions || {
      page: 1,
      limit: 10,
      skip: 0,
      sortOrder: 'desc'
    };
  }
} 