import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  clientId: process.env.KAFKA_CLIENT_ID || 'eventshog',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL === 'true' ? {
    mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  } : undefined,
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000'),
  authenticationTimeout: parseInt(process.env.KAFKA_AUTHENTICATION_TIMEOUT || '1000'),
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '100'),
    retries: parseInt(process.env.KAFKA_RETRIES || '8'),
  },
})); 