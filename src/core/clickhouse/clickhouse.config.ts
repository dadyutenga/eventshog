import { registerAs } from '@nestjs/config';

export default registerAs('clickhouse', () => ({
  url: process.env.CLICKHOUSE_URL || 'https://wcltowppfd.europe-west4.gcp.clickhouse.cloud:8443',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || 'l~98azdHgqPAB',
  database: process.env.CLICKHOUSE_DATABASE || 'default',
  request_timeout: parseInt(process.env.CLICKHOUSE_REQUEST_TIMEOUT || '30000'),
  keep_alive: process.env.CLICKHOUSE_KEEP_ALIVE === 'true',
})); 