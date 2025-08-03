import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDatabaseDto {
  @ApiProperty({ 
    example: 'tenant_123', 
    description: 'Name of the database to create' 
  })
  @IsString()
  databaseName: string;
}

export class ExecuteQueryDto {
  @ApiProperty({ 
    example: 'SELECT * FROM events LIMIT 10', 
    description: 'ClickHouse query to execute' 
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({ 
    enum: ['JSONEachRow', 'JSON'], 
    default: 'JSONEachRow',
    description: 'Response format for the query' 
  })
  @IsOptional()
  @IsEnum(['JSONEachRow', 'JSON'])
  format?: 'JSONEachRow' | 'JSON';
} 