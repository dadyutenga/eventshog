import { IsString, IsObject, IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Predefined event types for consistency
export enum EventType {
  // User lifecycle events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_DELETE = 'user_delete',
  
  // Device events
  DEVICE_LINK = 'device_link',
  DEVICE_UNLINK = 'device_unlink',
  
  // Session events
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  
  // Page/View events
  PAGE_VIEW = 'page_view',
  SCREEN_VIEW = 'screen_view',
  
  // Interaction events
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  FORM_START = 'form_start',
  
  // E-commerce events
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  
  // Custom events (for flexibility)
  CUSTOM = 'custom'
}

export class TrackEventDto {
  @ApiProperty({ 
    example: 'app_123', 
    description: 'Project key (app ID) for the application' 
  })
  @IsString()
  projectKey: string;

  @ApiProperty({ 
    enum: EventType,
    example: EventType.USER_SIGNUP, 
    description: 'Type of event to track' 
  })
  @IsEnum(EventType)
  eventName: EventType;

  @ApiPropertyOptional({ 
    example: 'user_123', 
    description: 'Unique identifier for the authenticated user (optional if deviceId is provided)' 
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ 
    example: 'device_abc123', 
    description: 'Unique device identifier for anonymous users (optional if userId is provided)' 
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

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

// Special DTO for device linking events
export class DeviceLinkEventDto {
  @ApiProperty({ 
    example: 'app_123', 
    description: 'Project key (app ID) for the application' 
  })
  @IsString()
  projectKey: string;

  @ApiProperty({ 
    example: 'user_123', 
    description: 'User ID to link the device to' 
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    example: 'device_abc123', 
    description: 'Device ID to link' 
  })
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({ 
    example: '2024-01-01T12:00:00Z', 
    description: 'Event timestamp (ISO string)' 
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({ 
    example: { source: 'signup_flow' }, 
    description: 'Additional properties' 
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
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

  @ApiProperty({ enum: EventType, example: EventType.USER_SIGNUP })
  eventName: EventType;

  @ApiPropertyOptional({ example: 'user_123' })
  userId?: string;

  @ApiPropertyOptional({ example: 'device_abc123' })
  deviceId?: string;

  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  timestamp: string;

  @ApiProperty({ example: true })
  success: boolean;
} 