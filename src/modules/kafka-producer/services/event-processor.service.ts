import { Injectable, Logger } from '@nestjs/common';
import { KafkaService, EventMessage } from '../../../core/kafka/kafka.service';
import { ClickHouseService } from '../../../core/clickhouse/clickhouse.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);
  private readonly EVENTS_TOPIC = 'events';

  constructor(
    private kafkaService: KafkaService,
    private clickHouseService: ClickHouseService,
    private authService: AuthService,
  ) {}

  async onModuleInit() {
    // Create the events topic if it doesn't exist
    try {
      await this.kafkaService.createTopic(this.EVENTS_TOPIC, 3, 1);
    } catch (error) {
      this.logger.warn(`Topic ${this.EVENTS_TOPIC} might already exist:`, error.message);
    }

    // Subscribe to events topic
    await this.kafkaService.subscribeToTopic(
      this.EVENTS_TOPIC,
      this.processEvent.bind(this)
    );
  }

  async processEvent(event: EventMessage): Promise<void> {
    try {
      this.logger.debug(`Processing event: ${event.id} for app: ${event.appId}`);

      // Validate the app exists and is active
      const app = await this.authService.validateApiKey(event.appId);
      if (!app) {
        this.logger.warn(`Invalid app ID for event ${event.id}: ${event.appId}`);
        return;
      }

      // Get the tenant database name
      const tenantDatabase = `tenant_${app.appId}`;

      // Ensure the tenant database and table exist
      await this.ensureTenantDatabase(tenantDatabase);

      // Prepare event data for ClickHouse
      const eventData = {
        app_id: event.appId,
        event_name: event.eventName,
        user_id: event.userId,
        session_id: event.sessionId || '',
        timestamp: event.timestamp,
        properties: JSON.stringify(event.properties),
        platform: event.platform,
        version: event.version || '',
      };

      // Insert event into ClickHouse
      await this.clickHouseService.insert(`${tenantDatabase}.events`, [eventData]);

      // Update app event count
      await this.authService.incrementEventCount(app.id);

      this.logger.debug(`Event ${event.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process event ${event.id}:`, error);
      // In production, you might want to send to a dead letter queue
    }
  }

  private async ensureTenantDatabase(databaseName: string): Promise<void> {
    try {
      await this.clickHouseService.createDatabase(databaseName);
      await this.clickHouseService.createEventsTable(databaseName);
    } catch (error) {
      this.logger.warn(`Database/table might already exist for ${databaseName}:`, error.message);
    }
  }

  async sendEvent(event: EventMessage): Promise<void> {
    await this.kafkaService.sendEvent(this.EVENTS_TOPIC, event);
  }

  async sendBatchEvents(events: EventMessage[]): Promise<void> {
    await this.kafkaService.sendBatchEvents(this.EVENTS_TOPIC, events);
  }
} 