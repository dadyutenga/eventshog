const { createClient } = require('@clickhouse/client');

async function testClickHouse() {
  const client = createClient({
    url: 'https://wcltowppfd.europe-west4.gcp.clickhouse.cloud:8443',
    username: 'default',
    password: 'l~98azdHgqPAB',
  });

  try {
    console.log('Testing ClickHouse connection...');
    
    const result = await client.query({
      query: 'SELECT 1 as test',
      format: 'JSONEachRow',
    });
    
    const data = await result.json();
    console.log('✅ ClickHouse connection successful!');
    console.log('Result:', data);
    
    // Test creating a database
    console.log('\nTesting database creation...');
    await client.query({
      query: 'CREATE DATABASE IF NOT EXISTS test_eventshog',
    });
    console.log('✅ Database creation successful!');
    
    // Test creating events table
    console.log('\nTesting events table creation...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_eventshog.events (
        id UUID DEFAULT generateUUIDv4(),
        app_id String,
        event_name String,
        user_id String,
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
    
    await client.query({
      query: createTableQuery,
    });
    console.log('✅ Events table creation successful!');
    
    // Test inserting an event
    console.log('\nTesting event insertion...');
    await client.insert({
      table: 'test_eventshog.events',
      values: [{
        app_id: 'test_app',
        event_name: 'test_event',
        user_id: 'test_user',
        session_id: 'test_session',
        timestamp: new Date().toISOString(),
        properties: JSON.stringify({ test: true }),
        platform: 'test',
        version: '1.0.0'
      }],
      format: 'JSONEachRow',
    });
    console.log('✅ Event insertion successful!');
    
    // Test querying events
    console.log('\nTesting event query...');
    const queryResult = await client.query({
      query: 'SELECT * FROM test_eventshog.events LIMIT 5',
      format: 'JSONEachRow',
    });
    
    const events = await queryResult.json();
    console.log('✅ Event query successful!');
    console.log('Events found:', events.length);
    
    await client.close();
    console.log('\n🎉 All ClickHouse tests passed!');
    
  } catch (error) {
    console.error('❌ ClickHouse test failed:', error);
  }
}

testClickHouse(); 