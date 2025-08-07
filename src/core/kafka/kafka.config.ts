import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const isManagedKafka = brokers.some(broker => broker.includes('managedkafka.eventshog.cloud.goog'));
  
  console.log('Kafka Configuration:');
  console.log('Brokers:', brokers);
  console.log('Is Managed Kafka:', isManagedKafka);
  console.log('Username:', process.env.KAFKA_USERNAME);
  console.log('SSL:', process.env.KAFKA_SSL);
  console.log('SASL:', process.env.KAFKA_SASL);
  console.log('SASL Mechanism:', process.env.KAFKA_SASL_MECHANISM);
  
  const config: any = {
    clientId: process.env.KAFKA_CLIENT_ID || 'eventshog',
    brokers: brokers,
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '30000'), // Increased timeout
    authenticationTimeout: parseInt(process.env.KAFKA_AUTHENTICATION_TIMEOUT || '10000'), // Increased timeout
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '1000'), // Increased retry time
      retries: parseInt(process.env.KAFKA_RETRIES || '8'),
    },
  };

  // For Google Cloud Managed Kafka, enable SSL and SASL with JAAS configuration
  if (isManagedKafka) {
    config.ssl = true;
    
    // Use JAAS configuration for Google Cloud Managed Kafka
    const username = process.env.KAFKA_USERNAME || '';
    const password = process.env.KAFKA_PASSWORD || '';
    
    config.sasl = {
      mechanism: 'PLAIN',
      username: username,
      password: password,
    };
    
    // Set JAAS configuration for Google Cloud Managed Kafka
    config.saslJaasConfig = `org.apache.kafka.common.security.plain.PlainLoginModule required username="${username}" password="${password}";`;
    
    console.log('Configuring for Google Cloud Managed Kafka with SASL/PLAIN and JAAS');
    console.log('SSL enabled:', config.ssl);
    console.log('SASL mechanism:', config.sasl.mechanism);
    console.log('JAAS config set:', !!config.saslJaasConfig);
  } else {
    // For local or other Kafka setups
    config.ssl = process.env.KAFKA_SSL === 'true';
    if (process.env.KAFKA_SASL === 'true') {
      config.sasl = {
        mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      };
    }
  }

  return config;
}); 