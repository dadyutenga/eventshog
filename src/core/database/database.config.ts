import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const baseConfig: TypeOrmModuleOptions = {
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


  return baseConfig;
}); 