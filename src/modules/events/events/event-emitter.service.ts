import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventMessage } from '../../../core/kafka/kafka.service';

export const EVENT_NAMES = {
  EVENT_TRACKED: 'event.tracked',
  BATCH_EVENTS_TRACKED: 'batch.events.tracked',
  DEVICE_LINKED: 'device.linked',
} as const;

export interface EventTrackedPayload {
  event: EventMessage;
}

export interface BatchEventsTrackedPayload {
  events: EventMessage[];
}

export interface DeviceLinkedPayload {
  event: EventMessage;
}

@Injectable()
export class EventEmitterService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitEventTracked(event: EventMessage): void {
    this.eventEmitter.emit(EVENT_NAMES.EVENT_TRACKED, { event });
  }

  emitBatchEventsTracked(events: EventMessage[]): void {
    this.eventEmitter.emit(EVENT_NAMES.BATCH_EVENTS_TRACKED, { events });
  }

  emitDeviceLinked(event: EventMessage): void {
    this.eventEmitter.emit(EVENT_NAMES.DEVICE_LINKED, { event });
  }
} 