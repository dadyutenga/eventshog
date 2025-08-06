import { Module } from '@nestjs/common';
import { KafkaProducerModule } from '../kafka-producer/kafka-producer.module';
import { AuthModule } from '../auth/auth.module';
import { EventsController } from './controllers/events.controller';
import { EventEmitterService } from './events/event-emitter.service';
import { EventListenerService } from './events/event-listener.service';

@Module({
  imports: [
    KafkaProducerModule, 
    AuthModule
  ],
  controllers: [EventsController],
  providers: [EventEmitterService, EventListenerService],
  exports: [EventEmitterService],
})
export class EventsModule {} 