import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ClickHouseService } from '../core/clickhouse/clickhouse.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const clickhouseService = app.get(ClickHouseService);

  try {
    console.log('🔍 Checking ClickHouse connection...');
    
    // Test connection
    const connectionTest = await clickhouseService.testConnection();
    console.log('✅ Connection test:', connectionTest);

    // Check if events table exists
    const tableExists = await clickhouseService.tableExists('default', 'events');
    console.log('📊 Events table exists:', tableExists);

    if (!tableExists) {
      console.log('🚀 Creating events table...');
      await clickhouseService.createEventsTable('default', 'events');
      console.log('✅ Events table created successfully!');
    } else {
      console.log('✅ Events table already exists');
    }

    // Get table info
    const tableInfo = await clickhouseService.getTableInfo('default', 'events');
    console.log('📋 Table info:', tableInfo);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
