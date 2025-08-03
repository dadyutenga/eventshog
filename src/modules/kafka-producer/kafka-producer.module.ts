import { Module } from '@nestjs/common';
import { KafkaModule } from '../../core/kafka/kafka.module';
import { ClickHouseModule } from '../../core/clickhouse/clickhouse.module';
import { AuthModule } from '../auth/auth.module';
import { EventProcessorService } from './services/event-processor.service';

@Module({
  imports: [KafkaModule, ClickHouseModule, AuthModule],
  providers: [EventProcessorService],
  exports: [EventProcessorService],
})
export class KafkaProducerModule {}
