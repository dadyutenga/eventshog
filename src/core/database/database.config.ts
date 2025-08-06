import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const baseConfig: any = {
    type:   process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [path.join(__dirname, '../../modules/**/*.entity{.ts,.js}')],
    synchronize: process.env.DB_SYNCHRONIZE as any,
    logging: process.env.DB_LOGGING as any,
    timezone: process.env.DB_TIMEZONE_UTC,
    extra: {
      timezone: process.env.DB_TIMEZONE_STRING,
    },
  };

  // Add SSL configuration if certificates are provided
  if (process.env.DB_SSL_ENABLED === 'true') {
    const sslConfig: any = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };

    // Add CA certificate if provided
    if (process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH)) {
      sslConfig.ca = fs.readFileSync(process.env.DB_SSL_CA_PATH);
    }

    // Add client certificate if provided
    if (process.env.DB_SSL_CERT_PATH && fs.existsSync(process.env.DB_SSL_CERT_PATH)) {
      sslConfig.cert = fs.readFileSync(process.env.DB_SSL_CERT_PATH);
    }

    // Add client key if provided
    if (process.env.DB_SSL_KEY_PATH && fs.existsSync(process.env.DB_SSL_KEY_PATH)) {
      sslConfig.key = fs.readFileSync(process.env.DB_SSL_KEY_PATH);
    }

    baseConfig.ssl = sslConfig;
  }

  return baseConfig;
}); 