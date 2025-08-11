import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleDestroy {
  private client: ClickHouseClient;
  private readonly logger = new Logger(ClickHouseService.name);

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    const config = this.configService.get('clickhouse');
    
    this.client = createClient({
      url: config.url,
      username: config.username,
      password: config.password,
      database: config.database,
      request_timeout: config.request_timeout,
      keep_alive: config.keep_alive,
    });

    this.logger.log('ClickHouse client initialized');
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.query({
        query: 'SELECT 1 as test',
        format: 'JSONEachRow',
      });
      const data = await result.json();
      this.logger.log('ClickHouse connection test successful');
      return data.length > 0 && (data[0] as any).test === 1;
    } catch (error) {
      this.logger.error('ClickHouse connection test failed:', error);
      return false;
    }
  }

  async executeQuery(query: string, format: 'JSONEachRow' | 'JSON' = 'JSONEachRow') {
    try {
      const result = await this.client.query({
        query,
        format,
      });
      return await result.json();
    } catch (error) {
      this.logger.error('ClickHouse query execution failed:', error);
      throw error;
    }
  }

  async executeQueryInDatabase(databaseName: string, query: string, format: 'JSONEachRow' | 'JSON' = 'JSONEachRow') {
    try {
      const result = await this.client.query({
        query: `USE ${databaseName}; ${query}`,
        format,
      });
      return await result.json();
    } catch (error) {
      this.logger.error(`ClickHouse query execution failed in database ${databaseName}:`, error);
      throw error;
    }
  }

  getDatabaseNameFromAppId(appId: string): string {
    return `tenant_${appId}`;
  }

  async insert(table: string, data: any[]) {
    try {
      await this.client.insert({
        table,
        values: data,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Inserted ${data.length} rows into ${table}`);
    } catch (error) {
      this.logger.error(`ClickHouse insert failed for table ${table}:`, error);
      throw error;
    }
  }

  async createDatabase(databaseName: string): Promise<void> {
    try {
      // Validate database name to prevent SQL injection
      if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
        throw new Error('Invalid database name. Only alphanumeric characters and underscores are allowed.');
      }
      
      await this.client.query({
        query: `CREATE DATABASE IF NOT EXISTS ${databaseName}`,
      });
      this.logger.log(`Database ${databaseName} created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create database ${databaseName}:`, error);
      throw error;
    }
  }

  async tableExists(databaseName: string, tableName: string): Promise<boolean> {
    try {
      // Validate database and table names to prevent SQL injection
      if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
        throw new Error('Invalid database name. Only alphanumeric characters and underscores are allowed.');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        throw new Error('Invalid table name. Only alphanumeric characters and underscores are allowed.');
      }

      const result = await this.client.query({
        query: `
          SELECT count() as count 
          FROM system.tables 
          WHERE database = '${databaseName}' AND name = '${tableName}'
        `,
        format: 'JSONEachRow',
      });
      
      const data = await result.json();
      const exists = data.length > 0 && (data[0] as any).count > 0;
      
      this.logger.debug(`Table ${databaseName}.${tableName} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check if table ${databaseName}.${tableName} exists:`, error);
      return false;
    }
  }

  async databaseExists(databaseName: string): Promise<boolean> {
    try {
      // Validate database name to prevent SQL injection
      if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
        throw new Error('Invalid database name. Only alphanumeric characters and underscores are allowed.');
      }

      const result = await this.client.query({
        query: `
          SELECT count() as count 
          FROM system.databases 
          WHERE name = '${databaseName}'
        `,
        format: 'JSONEachRow',
      });
      
      const data = await result.json();
      const exists = data.length > 0 && (data[0] as any).count > 0;
      
      this.logger.debug(`Database ${databaseName} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check if database ${databaseName} exists:`, error);
      return false;
    }
  }

  async getTableInfo(databaseName: string, tableName: string): Promise<any> {
    try {
      // Validate database and table names to prevent SQL injection
      if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
        throw new Error('Invalid database name. Only alphanumeric characters and underscores are allowed.');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        throw new Error('Invalid table name. Only alphanumeric characters and underscores are allowed.');
      }

      const result = await this.client.query({
        query: `
          SELECT 
            name,
            engine,
            total_rows,
            total_bytes,
            metadata_modification_time
          FROM system.tables 
          WHERE database = '${databaseName}' AND name = '${tableName}'
        `,
        format: 'JSONEachRow',
      });
      
      const data = await result.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      this.logger.error(`Failed to get table info for ${databaseName}.${tableName}:`, error);
      return null;
    }
  }

  async createEventsTable(databaseName: string, tableName: string = 'events'): Promise<void> {
    // Validate database and table names to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
      throw new Error('Invalid database name. Only alphanumeric characters and underscores are allowed.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name. Only alphanumeric characters and underscores are allowed.');
    }

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${databaseName}.${tableName} (
        id UUID DEFAULT generateUUIDv4(),
        app_id String,
        event_name String,
        user_id Nullable(String),
        device_id Nullable(String),
        session_id String,
        timestamp DateTime64(3),
        properties JSON,
        platform String,
        version String,
        created_at DateTime64(3) DEFAULT now()
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (app_id, event_name, timestamp)
      SETTINGS index_granularity = 8192
    `;

    try {
      await this.client.query({
        query: createTableQuery,
      });
      this.logger.log(`Events table ${databaseName}.${tableName} created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create events table:`, error);
      throw error;
    }
  }

  async getClient(): Promise<ClickHouseClient> {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('ClickHouse client closed');
    }
  }
} 