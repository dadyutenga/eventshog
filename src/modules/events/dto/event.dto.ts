import { IsString, IsObject, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty({ 
    example: 'user_signup', 
    description: 'Name of the event to track' 
  })
  @IsString()
  eventName: string;

  @ApiProperty({ 
    example: 'user_123', 
    description: 'Unique identifier for the user' 
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ 
    example: 'session_456', 
    description: 'Session identifier' 
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-01T12:00:00Z', 
    description: 'Event timestamp (ISO string)' 
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({ 
    example: { plan: 'premium', source: 'web' }, 
    description: 'Additional event properties' 
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ 
    example: 'web', 
    description: 'Platform where the event occurred' 
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ 
    example: '1.0.0', 
    description: 'App version' 
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ 
    example: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }, 
    description: 'Additional metadata' 
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BatchTrackEventsDto {
  @ApiProperty({ 
    type: [TrackEventDto], 
    description: 'Array of events to track' 
  })
  events: TrackEventDto[];
}

export class EventResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user_signup' })
  eventName: string;

  @ApiProperty({ example: 'user_123' })
  userId: string;

  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  timestamp: string;

  @ApiProperty({ example: true })
  success: boolean;
} 