import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClickHouseService } from './clickhouse.service';
import { ClickHouseController } from '../../modules/clickhouse/controllers/clickhouse.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ClickHouseController],
  providers: [ClickHouseService],
  exports: [ClickHouseService],
})
export class ClickHouseModule {} 