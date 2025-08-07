import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaMessage, EachMessagePayload } from 'kafkajs';

export interface EventMessage {
  id: string;
  appId: string;
  eventName: string;
  userId?: string;
  deviceId?: string;
  sessionId?: string;
  timestamp: string;
  properties: Record<string, any>;
  platform: string;
  version?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private readonly logger = new Logger(KafkaService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.initializeKafka();
  }

  private initializeKafka() {
    const config = this.configService.get('kafka');
    
    this.logger.log('Initializing Kafka client with configuration:');
    this.logger.log(`Client ID: ${config.clientId}`);
    this.logger.log(`Brokers: ${config.brokers.join(', ')}`);
    this.logger.log(`SSL: ${config.ssl}`);
    this.logger.log(`SASL: ${JSON.stringify(config.sasl)}`);
    this.logger.log(`Connection Timeout: ${config.connectionTimeout}`);
    this.logger.log(`Authentication Timeout: ${config.authenticationTimeout}`);
    
    const kafkaConfig: any = {
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      connectionTimeout: config.connectionTimeout,
      authenticationTimeout: config.authenticationTimeout,
      retry: config.retry,
    };

    // Add SASL configuration
    if (config.sasl) {
      kafkaConfig.sasl = config.sasl;
      
      // For Google Cloud Managed Kafka, also set the JAAS configuration
      if (config.saslJaasConfig) {
        kafkaConfig.saslJaasConfig = config.saslJaasConfig;
        this.logger.log('Using JAAS configuration for Google Cloud Managed Kafka');
      }
    }

    this.kafka = new Kafka(kafkaConfig);

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ 
      groupId: `${config.clientId}-consumer-group` 
    });

    this.logger.log('Kafka client initialized');
  }

  async connect(): Promise<void> {
    try {
      this.logger.log('Attempting to connect to Kafka...');
      
      // Test DNS resolution first
      const config = this.configService.get('kafka');
      for (const broker of config.brokers) {
        this.logger.log(`Testing connection to broker: ${broker}`);
      }
      
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
      
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected successfully');
      
      this.isConnected = true;
      this.logger.log('Kafka producer and consumer connected');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      this.logger.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer and consumer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect from Kafka:', error);
    }
  }

  async sendEvent(topic: string, event: EventMessage): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify(event),
            headers: {
              appId: event.appId,
              eventName: event.eventName,
              timestamp: event.timestamp,
            },
          },
        ],
      });
      
      this.logger.debug(`Event sent to topic ${topic}: ${event.id}`);
    } catch (error) {
      this.logger.error(`Failed to send event to topic ${topic}:`, error);
      throw error;
    }
  }

  async sendBatchEvents(topic: string, events: EventMessage[]): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const messages = events.map(event => ({
        key: event.id,
        value: JSON.stringify(event),
        headers: {
          appId: event.appId,
          eventName: event.eventName,
          timestamp: event.timestamp,
        },
      }));

      await this.producer.send({
        topic,
        messages,
      });
      
      this.logger.debug(`Batch of ${events.length} events sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send batch events to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribeToTopic(
    topic: string, 
    handler: (event: EventMessage) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          try {
            const message = payload.message;
            const event = JSON.parse(message.value?.toString() || '{}') as EventMessage;
            
            await handler(event);
            
            this.logger.debug(`Event processed from topic ${topic}: ${event.id}`);
          } catch (error) {
            this.logger.error(`Failed to process message from topic ${topic}:`, error);
            // In production, you might want to send to a dead letter queue
          }
        },
      });
      
      this.logger.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  async createTopic(topic: string, partitions: number = 3, replicationFactor: number = 1): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: partitions,
            replicationFactor,
          },
        ],
      });
      
      await admin.disconnect();
      this.logger.log(`Topic ${topic} created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create topic ${topic}:`, error);
      throw error;
    }
  }

  async getTopicMetadata(topic: string): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
      const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
      
      await admin.disconnect();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get metadata for topic ${topic}:`, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }
} 