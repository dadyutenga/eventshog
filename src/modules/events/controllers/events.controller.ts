import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiHeader 
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { EventProcessorService } from '../../kafka-producer/services/event-processor.service';
import { TrackEventDto, BatchTrackEventsDto, EventResponseDto } from '../dto/event.dto';
import { EventMessage } from '../../../core/kafka/kafka.service';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private eventProcessorService: EventProcessorService) {}

  @Post('track')
  @UseGuards(ApiKeyGuard)
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
    const app = req.app; // Set by ApiKeyGuard
    const eventId = uuidv4();
    const timestamp = trackEventDto.timestamp || new Date().toISOString();

    const event: EventMessage = {
      id: eventId,
      appId: app.appId,
      eventName: trackEventDto.eventName,
      userId: trackEventDto.userId,
      sessionId: trackEventDto.sessionId,
      timestamp,
      properties: trackEventDto.properties || {},
      platform: trackEventDto.platform || app.platform,
      version: trackEventDto.version,
      metadata: trackEventDto.metadata,
    };

    // Send event to Kafka for processing
    await this.eventProcessorService.sendEvent(event);

    return {
      id: eventId,
      eventName: trackEventDto.eventName,
      userId: trackEventDto.userId,
      timestamp,
      success: true,
    };
  }

  @Post('track/batch')
  @UseGuards(ApiKeyGuard)
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
    const app = req.app; // Set by ApiKeyGuard
    const responses: EventResponseDto[] = [];

    const events: EventMessage[] = batchTrackEventsDto.events.map(trackEventDto => {
      const eventId = uuidv4();
      const timestamp = trackEventDto.timestamp || new Date().toISOString();

      responses.push({
        id: eventId,
        eventName: trackEventDto.eventName,
        userId: trackEventDto.userId,
        timestamp,
        success: true,
      });

      return {
        id: eventId,
        appId: app.appId,
        eventName: trackEventDto.eventName,
        userId: trackEventDto.userId,
        sessionId: trackEventDto.sessionId,
        timestamp,
        properties: trackEventDto.properties || {},
        platform: trackEventDto.platform || app.platform,
        version: trackEventDto.version,
        metadata: trackEventDto.metadata,
      };
    });

    // Send batch events to Kafka for processing
    await this.eventProcessorService.sendBatchEvents(events);

    return responses;
  }
} 