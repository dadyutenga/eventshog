

import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { ClickHouseModule } from '../../core/clickhouse/clickhouse.module';
import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { AnalyticsController } from './controller/analytics.controller';

@Module({
  imports: [ClickHouseModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}