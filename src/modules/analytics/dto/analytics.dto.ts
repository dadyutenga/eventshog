import { IsString, IsOptional, IsDateString, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsFilterDto {
  @ApiProperty({ description: 'App ID to filter events' })
  @IsString()
  appId: string;

  @ApiProperty({ description: 'Start date for filtering (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for filtering (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'User ID to filter events', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Device ID to filter events', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ description: 'Event name to filter events', required: false })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiProperty({ description: 'Platform to filter events', required: false })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ description: 'App version to filter events', required: false })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiProperty({ description: 'Limit number of results', required: false, default: 100 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class CustomQueryDto {
  @ApiProperty({ description: 'App ID for the query' })
  @IsString()
  appId: string;

  @ApiProperty({ description: 'Custom SQL query to execute' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Query parameters', required: false })
  @IsOptional()
  parameters?: Record<string, any>;
}

export class EventQueryDto {
  @ApiProperty({ description: 'App ID to query events' })
  @IsString()
  appId: string;

  @ApiProperty({ description: 'Event name to query', required: false })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiProperty({ description: 'User ID to query events', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Device ID to query events', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ description: 'Start date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Limit results', required: false, default: 100 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class UserJourneyDto {
  @ApiProperty({ description: 'App ID' })
  @IsString()
  appId: string;

  @ApiProperty({ description: 'User ID to get journey for' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Device ID', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ description: 'Start date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
