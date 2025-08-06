import { Injectable, Logger } from '@nestjs/common';
import { KafkaService, EventMessage } from '../../../core/kafka/kafka.service';
import { ClickHouseService } from '../../../core/clickhouse/clickhouse.service';
import { AuthService } from '../../auth/services/auth.service';
import { EventType } from '../../events/dto/event.dto';

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
      const app = await this.authService.validateProjectKey(event.appId);
      if (!app) {
        this.logger.warn(`Invalid app ID for event ${event.id}: ${event.appId}`);
        return;
      }

      // Get the tenant database name
      const tenantDatabase = `tenant_${app.appId}`;

      // Ensure the tenant database and table exist
      await this.ensureTenantDatabase(tenantDatabase);

      // Handle special events
      if (event.eventName === EventType.DEVICE_LINK) {
        await this.handleDeviceLinkEvent(event, tenantDatabase);
      }

      // Prepare event data for ClickHouse
      const eventData = {
        app_id: event.appId,
        event_name: event.eventName,
        user_id: event.userId || null,
        device_id: event.deviceId || null,
        session_id: event.sessionId || '',
        timestamp: event.timestamp,
        properties: event.properties, // Don't stringify - ClickHouse expects JSON object
        platform: event.platform,
        version: event.version || '',
      };

      this.logger.debug(`Event data prepared for ClickHouse: ${JSON.stringify(eventData, null, 2)}`);

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
      // Check if database exists
      const dbExists = await this.clickHouseService.databaseExists(databaseName);
      if (!dbExists) {
        this.logger.log(`Creating database ${databaseName}`);
        await this.clickHouseService.createDatabase(databaseName);
      }

      // Check if events table exists
      const tableExists = await this.clickHouseService.tableExists(databaseName, 'events');
      if (!tableExists) {
        this.logger.log(`Creating events table in ${databaseName}`);
        await this.clickHouseService.createEventsTable(databaseName);
      }

      this.logger.debug(`Tenant database ${databaseName} is ready`);
    } catch (error) {
      this.logger.error(`Failed to ensure tenant database ${databaseName}:`, error);
      throw error;
    }
  }

  private async handleDeviceLinkEvent(event: EventMessage, tenantDatabase: string): Promise<void> {
    try {
      if (!event.userId || !event.deviceId) {
        this.logger.warn('Device link event missing userId or deviceId');
        return;
      }

      // Check if the events table exists before running ALTER TABLE
      const tableExists = await this.clickHouseService.tableExists(tenantDatabase, 'events');
      if (!tableExists) {
        this.logger.warn(`Events table does not exist in ${tenantDatabase}, skipping device link update`);
        return;
      }

      // Update all previous events where device_id matches and user_id is null
      const updateQuery = `
        ALTER TABLE ${tenantDatabase}.events 
        UPDATE user_id = '${event.userId}' 
        WHERE device_id = '${event.deviceId}' AND user_id IS NULL
      `;

      await this.clickHouseService.executeQuery(updateQuery);
      
      this.logger.log(`Linked device ${event.deviceId} to user ${event.userId} in database ${tenantDatabase}`);
    } catch (error) {
      this.logger.error(`Failed to handle device link event:`, error);
      throw error;
    }
  }

  async sendEvent(event: EventMessage): Promise<void> {
    await this.kafkaService.sendEvent(this.EVENTS_TOPIC, event);
  }

  async sendBatchEvents(events: EventMessage[]): Promise<void> {
    await this.kafkaService.sendBatchEvents(this.EVENTS_TOPIC, events);
  }
} 