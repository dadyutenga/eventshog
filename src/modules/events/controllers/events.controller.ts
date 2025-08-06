import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus, 
  Get
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiHeader 
} from '@nestjs/swagger';
import { ProjectKeyGuard } from '../../auth/guards/project-key.guard';
import { EventEmitterService } from '../events/event-emitter.service';
import { TrackEventDto, BatchTrackEventsDto, EventResponseDto, DeviceLinkEventDto, EventType } from '../dto/event.dto';
import { EventMessage } from '../../../core/kafka/kafka.service';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private eventEmitterService: EventEmitterService) {}

@Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if the events service is running' })
  @ApiResponse({ status: 200, description: 'Events service is running' })
  healthCheck(): string {
    return 'Events service is running';
  }

  @Post('track')
  @UseGuards(ProjectKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Track a single event' })
  @ApiResponse({ 
    status: 202, 
    description: 'Event accepted for processing',
    type: EventResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async trackEvent(
    @Request() req,
    @Body() trackEventDto: TrackEventDto
  ): Promise<EventResponseDto> {
    const app = req.app; // Set by ProjectKeyGuard
    const eventId = uuidv4();
    const timestamp = trackEventDto.timestamp || new Date().toISOString();

    // Validate that either userId or deviceId is provided
    if (!trackEventDto.userId && !trackEventDto.deviceId) {
      throw new Error('Either userId or deviceId must be provided');
    }

    const event: EventMessage = {
      id: eventId,
      appId: app.appId,
      eventName: trackEventDto.eventName,
      userId: trackEventDto.userId,
      deviceId: trackEventDto.deviceId,
      sessionId: trackEventDto.sessionId,
      timestamp,
      properties: trackEventDto.properties || {},
      platform: trackEventDto.platform || app.platform,
      version: trackEventDto.version,
      metadata: trackEventDto.metadata,
    };

    // Emit event for async Kafka processing
    this.eventEmitterService.emitEventTracked(event);

    return {
      id: eventId,
      eventName: trackEventDto.eventName,
      userId: trackEventDto.userId,
      deviceId: trackEventDto.deviceId,
      timestamp,
      success: true,
    };
  }

  @Post('track/batch')
  @UseGuards(ProjectKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Track multiple events in batch' })
  @ApiResponse({ 
    status: 202, 
    description: 'Events accepted for processing',
    type: [EventResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async trackBatchEvents(
    @Request() req,
    @Body() batchTrackEventsDto: BatchTrackEventsDto
  ): Promise<EventResponseDto[]> {
    const app = req.app; // Set by ProjectKeyGuard
    const responses: EventResponseDto[] = [];

    const events: EventMessage[] = batchTrackEventsDto.events.map(trackEventDto => {
      const eventId = uuidv4();
      const timestamp = trackEventDto.timestamp || new Date().toISOString();

      // Validate that either userId or deviceId is provided
      if (!trackEventDto.userId && !trackEventDto.deviceId) {
        throw new Error('Either userId or deviceId must be provided for each event');
      }

      responses.push({
        id: eventId,
        eventName: trackEventDto.eventName,
        userId: trackEventDto.userId,
        deviceId: trackEventDto.deviceId,
        timestamp,
        success: true,
      });

      return {
        id: eventId,
        appId: app.appId,
        eventName: trackEventDto.eventName,
        userId: trackEventDto.userId,
        deviceId: trackEventDto.deviceId,
        sessionId: trackEventDto.sessionId,
        timestamp,
        properties: trackEventDto.properties || {},
        platform: trackEventDto.platform || app.platform,
        version: trackEventDto.version,
        metadata: trackEventDto.metadata,
      };
    });

    // Emit batch events for async Kafka processing
    this.eventEmitterService.emitBatchEventsTracked(events);

    return responses;
  }

  @Post('link-device')
  @UseGuards(ProjectKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Link a device to a user via event' })
  @ApiResponse({ 
    status: 202, 
    description: 'Device link event accepted for processing',
    type: EventResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async linkDeviceToUser(
    @Request() req,
    @Body() deviceLinkEventDto: DeviceLinkEventDto
  ): Promise<EventResponseDto> {
    const app = req.app; // Set by ProjectKeyGuard
    const eventId = uuidv4();
    const timestamp = deviceLinkEventDto.timestamp || new Date().toISOString();

    const event: EventMessage = {
      id: eventId,
      appId: app.appId,
      eventName: EventType.DEVICE_LINK,
      userId: deviceLinkEventDto.userId,
      deviceId: deviceLinkEventDto.deviceId,
      timestamp,
      properties: deviceLinkEventDto.properties || {},
      platform: app.platform,
    };

    // Emit device link event for async Kafka processing
    this.eventEmitterService.emitDeviceLinked(event);

    return {
      id: eventId,
      eventName: EventType.DEVICE_LINK,
      userId: deviceLinkEventDto.userId,
      deviceId: deviceLinkEventDto.deviceId,
      timestamp,
      success: true,
    };
  }
} 