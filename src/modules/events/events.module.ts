import { Module } from '@nestjs/common';
import { KafkaProducerModule } from '../kafka-producer/kafka-producer.module';
import { AuthModule } from '../auth/auth.module';
import { EventsController } from './controllers/events.controller';

@Module({
  imports: [KafkaProducerModule, AuthModule],
  controllers: [EventsController],
  exports: [],
})
export class EventsModule {} 