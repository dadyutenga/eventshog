import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading environment from:', envPath);
config({ path: envPath });

const dbConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: process.env.DB_SSL === 'true' ? {
    ca: fs.readFileSync(path.resolve(process.cwd(), 'ca-certificate.crt')),
  } : undefined,
  timezone: '+03:00', // <-- important

};

// Log configuration (excluding password)
console.log('Database Configuration:', {
  ...dbConfig,
  password: dbConfig.password ? '******' : undefined
});

export default new DataSource(dbConfig);
