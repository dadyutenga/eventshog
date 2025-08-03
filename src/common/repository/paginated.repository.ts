import { Repository, SelectQueryBuilder, FindManyOptions, FindOptionsWhere, Like, ObjectLiteral } from 'typeorm';
import { BaseRepository } from './base.repository';
import { PaginationOptions, PaginatedResponseDto } from '../dto/pagination.dto';

export abstract class PaginatedRepository<T extends ObjectLiteral> extends BaseRepository<T> {
  protected abstract getSearchableFields(): string[];
  protected abstract getDefaultSortField(): string;

  async findPaginated(
    options: PaginationOptions,
    additionalWhere?: FindOptionsWhere<T>,
    relations?: string[]
  ): Promise<PaginatedResponseDto<T>> {
    const { page, limit, skip, search, sortBy, sortOrder } = options;

    // Build query
    const queryBuilder = this.repository.createQueryBuilder('entity');

    // Add relations if specified
    if (relations && relations.length > 0) {
      relations.forEach(relation => {
        queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      });
    }

    // Add search conditions
    if (search && this.getSearchableFields().length > 0) {
      const searchConditions = this.getSearchableFields().map(field => {
        // Special handling for phoneNumber field to support partial searches
        if (field === 'phoneNumber') {
          return `(
            LOWER(entity.${field}) LIKE LOWER(:search) OR 
            LOWER(entity.${field}) LIKE LOWER(:searchWithCountryCode) OR
            LOWER(entity.${field}) LIKE LOWER(:searchWithoutCountryCode)
          )`;
        }
        return `LOWER(entity.${field}) LIKE LOWER(:search)`;
      });
      
      // Prepare search parameters
      const searchParams: any = { search: `%${search}%` };
      
      // Add phone number specific parameters
      if (this.getSearchableFields().includes('phoneNumber')) {
        // If search starts with 0, also search for 255 + rest of number
        if (search.startsWith('0')) {
          searchParams.searchWithCountryCode = `%255${search.substring(1)}%`;
          searchParams.searchWithoutCountryCode = `%${search.substring(1)}%`;
        }
        // If search starts with 255, also search for 0 + rest of number
        else if (search.startsWith('255')) {
          searchParams.searchWithCountryCode = `%${search}%`;
          searchParams.searchWithoutCountryCode = `%0${search.substring(3)}%`;
        }
        // If search doesn't start with 0 or 255, try both formats
        else {
          searchParams.searchWithCountryCode = `%255${search}%`;
          searchParams.searchWithoutCountryCode = `%0${search}%`;
        }
      }
      
      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, searchParams);
    }

    // Add additional where conditions with proper table prefixing
    if (additionalWhere) {
      this.buildWhereConditions(queryBuilder, additionalWhere);
    }

    // Add sorting
    const sortField = sortBy || this.getDefaultSortField();
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`entity.${sortField}`, order);

    // Add pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [items, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(items, page, limit, total);
  }

  private buildWhereConditions(queryBuilder: SelectQueryBuilder<T>, whereConditions: any, prefix: string = 'entity'): void {
    Object.keys(whereConditions).forEach(key => {
      const value = whereConditions[key];
      if (value !== undefined && value !== null) {
        // Handle nested objects (like { user: { id: userId } })
        if (typeof value === 'object' && !Array.isArray(value) && value !== null && !(value instanceof Date)) {
          // This is a nested object, so we need to join the relation and build conditions for it
          const relationAlias = key;
          this.buildWhereConditions(queryBuilder, value, relationAlias);
        } else {
          // Handle simple key-value pairs
          const paramName = `${prefix}_${key}`;
          queryBuilder.andWhere(`${prefix}.${key} = :${paramName}`, { [paramName]: value });
        }
      }
    });
  }

  async findPaginatedWithOptions(
    options: PaginationOptions,
    findOptions?: FindManyOptions<T>
  ): Promise<PaginatedResponseDto<T>> {
    const { page, limit, skip, search, sortBy, sortOrder } = options;

    // Prepare find options
    const finalOptions: FindManyOptions<T> = {
      ...findOptions,
      skip,
      take: limit,
      order: findOptions?.order || {
        [sortBy || this.getDefaultSortField()]: sortOrder === 'asc' ? 'ASC' : 'DESC'
      } as any
    };

    // Add search conditions if search is provided
    if (search && this.getSearchableFields().length > 0) {
      // For complex search logic like phone numbers, we need to use query builder
      // So we'll fall back to findPaginated method for search
      if (this.getSearchableFields().includes('phoneNumber')) {
        // Use query builder approach for phone number searches
        const queryBuilder = this.repository.createQueryBuilder('entity');
        
        // Add relations if specified
        if (findOptions?.relations && Array.isArray(findOptions.relations)) {
          findOptions.relations.forEach(relation => {
            queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
          });
        }
        
        // Add existing where conditions
        if (findOptions?.where) {
          Object.keys(findOptions.where).forEach(key => {
            const value = (findOptions.where as any)[key];
            if (value !== undefined && value !== null) {
              queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
            }
          });
        }
        
        // Add phone number search logic
        const searchConditions = this.getSearchableFields().map(field => {
          if (field === 'phoneNumber') {
            return `(
              LOWER(entity.${field}) LIKE LOWER(:search) OR 
              LOWER(entity.${field}) LIKE LOWER(:searchWithCountryCode) OR
              LOWER(entity.${field}) LIKE LOWER(:searchWithoutCountryCode)
            )`;
          }
          return `LOWER(entity.${field}) LIKE LOWER(:search)`;
        });
        
        // Prepare search parameters
        const searchParams: any = { search: `%${search}%` };
        
        // Add phone number specific parameters
        if (search.startsWith('0')) {
          searchParams.searchWithCountryCode = `%255${search.substring(1)}%`;
          searchParams.searchWithoutCountryCode = `%${search.substring(1)}%`;
        } else if (search.startsWith('255')) {
          searchParams.searchWithCountryCode = `%${search}%`;
          searchParams.searchWithoutCountryCode = `%0${search.substring(3)}%`;
        } else {
          searchParams.searchWithCountryCode = `%255${search}%`;
          searchParams.searchWithoutCountryCode = `%0${search}%`;
        }
        
        queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, searchParams);
        
        // Add sorting
        const sortField = sortBy || this.getDefaultSortField();
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
        queryBuilder.orderBy(`entity.${sortField}`, order);
        
        // Add pagination
        queryBuilder.skip(skip).take(limit);
        
        // Execute query
        const [items, total] = await queryBuilder.getManyAndCount();
        return new PaginatedResponseDto(items, page, limit, total);
      } else {
        // Use simple search for non-phone number fields
        const searchConditions = this.getSearchableFields().map(field => ({
          [field]: Like(`%${search}%`)
        }));

        // If where conditions already exist, we need to merge them properly
        if (finalOptions.where) {
          const existingWhere = finalOptions.where;
          const searchWhere = searchConditions[0]; // Use first search condition for simplicity
          
          // Merge the conditions
          finalOptions.where = {
            ...existingWhere,
            ...searchWhere
          } as FindOptionsWhere<T>;
        } else {
          // If no existing where conditions, use the first search condition
          finalOptions.where = searchConditions[0] as FindOptionsWhere<T>;
        }
      }
    }

    // Execute query
    const [items, total] = await this.repository.findAndCount(finalOptions);

    return new PaginatedResponseDto(items, page, limit, total);
  }

  protected buildSearchQuery(queryBuilder: SelectQueryBuilder<T>, search: string): void {
    if (!search || this.getSearchableFields().length === 0) {
      return;
    }

    const searchConditions = this.getSearchableFields().map(field => {
      // Special handling for phoneNumber field to support partial searches
      if (field === 'phoneNumber') {
        return `(
          LOWER(entity.${field}) LIKE LOWER(:search) OR 
          LOWER(entity.${field}) LIKE LOWER(:searchWithCountryCode) OR
          LOWER(entity.${field}) LIKE LOWER(:searchWithoutCountryCode)
        )`;
      }
      return `LOWER(entity.${field}) LIKE LOWER(:search)`;
    });
    
    // Prepare search parameters
    const searchParams: any = { search: `%${search}%` };
    
    // Add phone number specific parameters
    if (this.getSearchableFields().includes('phoneNumber')) {
      // If search starts with 0, also search for 255 + rest of number
      if (search.startsWith('0')) {
        searchParams.searchWithCountryCode = `%255${search.substring(1)}%`;
        searchParams.searchWithoutCountryCode = `%${search.substring(1)}%`;
      }
      // If search starts with 255, also search for 0 + rest of number
      else if (search.startsWith('255')) {
        searchParams.searchWithCountryCode = `%${search}%`;
        searchParams.searchWithoutCountryCode = `%0${search.substring(3)}%`;
      }
      // If search doesn't start with 0 or 255, try both formats
      else {
        searchParams.searchWithCountryCode = `%255${search}%`;
        searchParams.searchWithoutCountryCode = `%0${search}%`;
      }
    }
    
    queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, searchParams);
  }

  protected buildSortQuery(queryBuilder: SelectQueryBuilder<T>, sortBy?: string, sortOrder?: 'asc' | 'desc'): void {
    const sortField = sortBy || this.getDefaultSortField();
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`entity.${sortField}`, order);
  }
} 