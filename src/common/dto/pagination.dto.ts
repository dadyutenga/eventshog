import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    example: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search term for filtering results',
    example: 'rent',
    required: false
  })
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Sort field',
    example: 'createdAt',
    required: false
  })
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    required: false,
    enum: ['asc', 'desc']
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  nextPage: number | null;

  @ApiProperty()
  previousPage: number | null;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
    this.nextPage = this.hasNextPage ? page + 1 : null;
    this.previousPage = this.hasPreviousPage ? page - 1 : null;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  meta: PaginationMetaDto;

  @ApiProperty()
  status: string = 'success';

  @ApiProperty()
  message: string = 'Data retrieved successfully';

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data;
    this.meta = new PaginationMetaDto(page, limit, total);
  }
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} 