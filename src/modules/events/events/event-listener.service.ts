import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventProcessorService } from '../../kafka-producer/services/event-processor.service';
import { 
  EventEmitterService, 
  EVENT_NAMES, 
  EventTrackedPayload, 
  BatchEventsTrackedPayload, 
  DeviceLinkedPayload 
} from './event-emitter.service';

@Injectable()
export class EventListenerService {
  private readonly logger = new Logger(EventListenerService.name);

  constructor(private eventProcessorService: EventProcessorService) {}

  @OnEvent(EVENT_NAMES.EVENT_TRACKED)
  async handleEventTracked(payload: EventTrackedPayload): Promise<void> {
    try {
      await this.eventProcessorService.sendEvent(payload.event);
      this.logger.log(`Event ${payload.event.id} sent to Kafka successfully`);
    } catch (error) {
      this.logger.error(`Failed to send event ${payload.event.id} to Kafka:`, error);
      // In production, you might want to retry or store failed events
    }
  }

  @OnEvent(EVENT_NAMES.BATCH_EVENTS_TRACKED)
  async handleBatchEventsTracked(payload: BatchEventsTrackedPayload): Promise<void> {
    try {
      await this.eventProcessorService.sendBatchEvents(payload.events);
      this.logger.log(`Batch of ${payload.events.length} events sent to Kafka successfully`);
    } catch (error) {
      this.logger.error(`Failed to send batch events to Kafka:`, error);
      // In production, you might want to retry or store failed events
    }
  }

  @OnEvent(EVENT_NAMES.DEVICE_LINKED)
  async handleDeviceLinked(payload: DeviceLinkedPayload): Promise<void> {
    try {
      await this.eventProcessorService.sendEvent(payload.event);
      this.logger.log(`Device link event ${payload.event.id} sent to Kafka successfully`);
    } catch (error) {
      this.logger.error(`Failed to send device link event ${payload.event.id} to Kafka:`, error);
      // In production, you might want to retry or store failed events
    }
  }
} 