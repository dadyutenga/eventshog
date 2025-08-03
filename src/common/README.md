# Pagination System Documentation

This document describes the comprehensive pagination system implemented in the Makazii backend application.

## Overview

The pagination system provides a standardized way to handle paginated data across all API endpoints that return lists of items. It includes:

- **Automatic pagination parameters** (page, limit, search, sortBy, sortOrder)
- **Consistent response format** with metadata
- **Search functionality** across specified fields
- **Sorting capabilities** with configurable fields
- **Type-safe implementation** with TypeScript

## Architecture

### Core Components

1. **PaginationQueryDto** - Request DTO for pagination parameters
2. **PaginatedResponseDto** - Response DTO with items and metadata
3. **PaginatedRepository** - Base repository with pagination methods
4. **PaginatedService** - Base service with pagination support
5. **PaginationInterceptor** - Automatic parameter processing
6. **@Paginated()** - Decorator for easy controller integration

### File Structure

```
src/common/
├── dto/
│   └── pagination.dto.ts          # Pagination DTOs and interfaces
├── repository/
│   ├── base.repository.ts         # Base repository with common methods
│   └── paginated.repository.ts    # Paginated repository with search/sort
├── services/
│   └── paginated.service.ts       # Base service with pagination methods
├── interceptors/
│   └── pagination.interceptor.ts  # Automatic pagination processing
└── decorators/
    └── pagination.decorator.ts    # @Paginated() decorator
```

## Usage

### 1. Repository Implementation

Extend `PaginatedRepository` and implement required methods:

```typescript
@Injectable()
export class YourRepository extends PaginatedRepository<YourEntity> {
  constructor(
    @InjectRepository(YourEntity)
    private readonly repository: Repository<YourEntity>,
  ) {
    super(repository);
  }

  protected getSearchableFields(): string[] {
    return ['name', 'description', 'category'];
  }

  protected getDefaultSortField(): string {
    return 'createdAt';
  }

  // Custom paginated methods
  async findActiveItems(options: any) {
    return this.findPaginated(options, { isActive: true }, ['relations']);
  }
}
```

### 2. Service Implementation

Extend `PaginatedService` and use pagination methods:

```typescript
@Injectable()
export class YourService extends PaginatedService<YourEntity> {
  constructor(private readonly repository: YourRepository) {
    super(repository);
  }

  async getAllItems(
    options: PaginationOptions,
  ): Promise<PaginatedResponseDto<YourEntity>> {
    return this.findAllPaginated(options, {}, ['relations']);
  }

  async getItemsByCategory(
    category: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponseDto<YourEntity>> {
    return this.repository.findPaginated(options, { category }, ['relations']);
  }
}
```

### 3. Controller Implementation

Use the `@Paginated()` decorator:

```typescript
@Controller('items')
export class YourController {
  constructor(private readonly service: YourService) {}

  @Get()
  @Paginated()
  @ApiOperation({ summary: 'Get paginated items' })
  async getItems(@Request() req): Promise<PaginatedResponseDto<YourEntity>> {
    const paginationOptions = this.service.getPaginationOptionsFromRequest(req);
    return this.service.getAllItems(paginationOptions);
  }
}
```

## API Parameters

### Query Parameters

All paginated endpoints automatically support these query parameters:

| Parameter   | Type            | Default        | Description                 |
| ----------- | --------------- | -------------- | --------------------------- |
| `page`      | number          | 1              | Page number (starts from 1) |
| `limit`     | number          | 10             | Items per page (max 100)    |
| `search`    | string          | -              | Search term for filtering   |
| `sortBy`    | string          | entity default | Field to sort by            |
| `sortOrder` | 'asc' \| 'desc' | 'desc'         | Sort order                  |

### Example Request

```
GET /api/items?page=2&limit=20&search=rent&sortBy=createdAt&sortOrder=asc
```

## Response Format

All paginated endpoints return a consistent response format:

```typescript
{
  "items": [...], // Array of items
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true,
    "nextPage": 3,
    "previousPage": 1
  },
  "status": "success",
  "message": "Data retrieved successfully"
}
```

## Search Functionality

The search feature automatically searches across all fields specified in `getSearchableFields()`:

```typescript
protected getSearchableFields(): string[] {
  return ['title', 'description', 'category'];
}
```

Search is case-insensitive and uses partial matching (LIKE %search%).

## Sorting

### Default Sorting

Each repository specifies a default sort field:

```typescript
protected getDefaultSortField(): string {
  return 'createdAt';
}
```

### Custom Sorting

Users can override sorting via query parameters:

```
GET /api/items?sortBy=title&sortOrder=asc
```

## Implementation Examples

### Goals Module

```typescript
// Repository
export class GoalsRepository extends PaginatedRepository<Goal> {
  protected getSearchableFields(): string[] {
    return ['title', 'description'];
  }

  protected getDefaultSortField(): string {
    return 'createdAt';
  }

  async findUserGoals(userId: string, options: any) {
    return this.findPaginated(options, { user: { id: userId } }, ['user', 'goalTransactions']);
  }
}

// Service
export class GoalsService extends PaginatedService<Goal> {
  async getGoalsByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResponseDto<GoalResponseDto>> {
    const paginatedGoals = await this.repository.findUserGoals(userId, options);
    return {
      ...paginatedGoals,
      items: paginatedGoals.items.map(goal => this.mapToResponseDto(goal))
    };
  }
}

// Controller
@Get()
@Paginated()
async getGoals(@Request() req): Promise<PaginatedResponseDto<GoalResponseDto>> {
  const paginationOptions = this.goalsService.getPaginationOptionsFromRequest(req);
  return this.goalsService.getGoalsByUserId(req.user.id, paginationOptions);
}
```

### Withdrawals Module

```typescript
// Repository
export class WithdrawalRepository extends PaginatedRepository<Withdrawal> {
  protected getSearchableFields(): string[] {
    return ['reason', 'notes'];
  }

  protected getDefaultSortField(): string {
    return 'created_at';
  }

  async findUserWithdrawals(userId: string, options: any) {
    return this.findPaginated(options, { user_id: userId }, [
      'user',
      'goal',
      'payment_details',
    ]);
  }
}

// Service
export class WithdrawalsService extends PaginatedService<Withdrawal> {
  async getUserWithdrawals(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponseDto<WithdrawalResponseDto>> {
    const paginatedWithdrawals = await this.repository.findUserWithdrawals(
      userId,
      options,
    );
    return {
      ...paginatedWithdrawals,
      items: paginatedWithdrawals.items.map(
        (withdrawal) => new WithdrawalResponseDto(withdrawal),
      ),
    };
  }
}
```

## Migration Guide

### From Legacy Endpoints

1. **Update Repository**: Extend `PaginatedRepository` instead of `BaseRepository`
2. **Update Service**: Extend `PaginatedService` and add paginated methods
3. **Update Controller**: Add `@Paginated()` decorator and update return types
4. **Keep Legacy Methods**: Maintain backward compatibility with legacy methods

### Example Migration

```typescript
// Before
async getUsers(): Promise<User[]> {
  return this.userRepository.findAll();
}

// After
async getUsers(options: PaginationOptions): Promise<PaginatedResponseDto<User>> {
  return this.findAllPaginated(options, {}, ['goals', 'payments']);
}

// Legacy method for backward compatibility
async getUsersLegacy(): Promise<User[]> {
  return this.userRepository.findAll();
}
```

## Best Practices

1. **Always specify searchable fields** - Only include fields that should be searchable
2. **Use meaningful default sort fields** - Usually `createdAt` or `updatedAt`
3. **Include relevant relations** - Load necessary related data for performance
4. **Validate pagination parameters** - The interceptor handles basic validation
5. **Use consistent naming** - Follow the established patterns
6. **Document your endpoints** - Use proper Swagger documentation

## Performance Considerations

1. **Index your searchable fields** - Add database indexes for better search performance
2. **Limit relations** - Only load necessary related data
3. **Use database-level pagination** - The system uses `LIMIT` and `OFFSET`
4. **Consider cursor-based pagination** - For very large datasets

## Error Handling

The pagination system includes built-in error handling:

- **Invalid page numbers** are automatically corrected to 1
- **Invalid limits** are clamped between 1 and 100
- **Invalid sort orders** default to 'desc'
- **Missing parameters** use sensible defaults

## Testing

When testing paginated endpoints:

1. **Test different page sizes** - Verify limit parameter works
2. **Test search functionality** - Verify search across specified fields
3. **Test sorting** - Verify sortBy and sortOrder parameters
4. **Test edge cases** - Empty results, single page, last page
5. **Test metadata accuracy** - Verify pagination metadata is correct

## Future Enhancements

Potential improvements to consider:

1. **Cursor-based pagination** for better performance with large datasets
2. **Advanced search filters** with multiple field combinations
3. **Faceted search** with aggregation support
4. **Caching layer** for frequently accessed paginated data
5. **Real-time pagination** with WebSocket updates
