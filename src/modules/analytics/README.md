# EventsHog Analytics System

## Overview

The EventsHog Analytics System provides a comprehensive way for any app to consume and analyze their event data stored in ClickHouse. This system is designed to be generic and flexible, allowing different apps to track their specific events without hardcoding business logic.

## Features

- **Generic Event Analytics**: Works with any app's event structure
- **Real-time Metrics**: Get live insights into app performance
- **User Journey Tracking**: Analyze individual user behavior patterns
- **Custom Queries**: Execute custom ClickHouse queries for specific needs
- **Content Performance**: Track content engagement and performance
- **Error Analytics**: Monitor and analyze error patterns
- **Conversion Funnels**: Understand user conversion paths
- **Multi-dimensional Filtering**: Filter by time, user, device, platform, etc.

## API Endpoints

### Authentication

All endpoints require both JWT authentication and API key validation.

### 1. Get Events

```
GET /analytics/events?appId={appId}&startDate={date}&endDate={date}&userId={userId}&eventName={eventName}&platform={platform}&version={version}&limit={limit}&offset={offset}
```

**Query Parameters:**

- `appId` (required): The app identifier
- `startDate` (optional): Start date for filtering (ISO string)
- `endDate` (optional): End date for filtering (ISO string)
- `userId` (optional): Filter by specific user
- `eventName` (optional): Filter by specific event type
- `platform` (optional): Filter by platform (ios, android, web)
- `version` (optional): Filter by app version
- `limit` (optional): Number of results to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

### 2. Get Analytics Metrics

```
GET /analytics/metrics?appId={appId}&startDate={date}&endDate={date}
```

Returns comprehensive metrics including:

- Total events count
- Unique users and devices
- Event breakdown by type
- Platform and version distribution
- Time series data

### 3. Get User Analytics

```
GET /analytics/users/{userId}?appId={appId}&startDate={date}&endDate={date}
```

Returns detailed analytics for a specific user:

- User activity summary
- Event breakdown
- Session information
- Platform and version details

### 4. Get Event Analytics

```
GET /analytics/events/{eventName}?appId={appId}&startDate={date}&endDate={date}
```

Returns analytics for a specific event type:

- Total occurrences
- Unique users and devices
- Time distribution
- User retention metrics

### 5. Execute Custom Query

```
POST /analytics/custom-query
```

**Body:**

```json
{
  "appId": "your_app_id",
  "query": "SELECT * FROM events WHERE app_id = 'your_app_id' AND event_name = 'USER_LOGIN' LIMIT 100"
}
```

**Security Note**: Custom queries must include `app_id = '{appId}'` filter for security.

### 6. Get Real-time Metrics

```
GET /analytics/real-time?appId={appId}
```

Returns live metrics:

- Active users in last hour
- Events per minute
- Top events
- Recent errors

### 7. Get Content Performance

```
GET /analytics/content-performance?appId={appId}&startDate={date}&endDate={date}
```

Analyzes content engagement:

- Content open rates
- Unique user counts
- Platform distribution
- Version analysis

### 8. Get User Engagement

```
GET /analytics/user-engagement?appId={appId}&startDate={date}&endDate={date}
```

Returns engagement metrics:

- Events per user
- Events per device
- User retention
- Session metrics

### 9. Get Error Analytics

```
GET /analytics/error-analytics?appId={appId}&startDate={date}&endDate={date}
```

Analyzes error patterns:

- Error counts by type
- Affected endpoints
- User impact analysis
- Error trends

### 10. Get Conversion Funnel

```
GET /analytics/conversion-funnel?appId={appId}&startDate={date}&endDate={date}
```

Analyzes user conversion paths:

- Funnel step progression
- Conversion rates
- Drop-off analysis

## Usage Examples

### For Kijiweni App

```bash
# Get all user login events for the last 7 days
GET /analytics/events?appId=kijiweni&eventName=USER_LOGIN&startDate=2024-01-08T00:00:00Z&endDate=2024-01-15T23:59:59Z

# Get content performance for episodes
GET /analytics/content-performance?appId=kijiweni&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z

# Get real-time user activity
GET /analytics/real-time?appId=kijiweni

# Analyze user journey for a specific user
GET /analytics/users/user_123?appId=kijiweni&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
```

### For Any Other App

```bash
# Get all events for a different app
GET /analytics/events?appId=myapp&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z

# Get metrics for a specific platform
GET /analytics/metrics?appId=myapp&platform=ios&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z

# Execute custom query for specific analysis
POST /analytics/custom-query
{
  "appId": "myapp",
  "query": "SELECT event_name, count() as count FROM events WHERE app_id = 'myapp' AND timestamp >= '2024-01-01' GROUP BY event_name ORDER BY count DESC"
}
```

## Data Structure

The system expects events to have this structure in ClickHouse:

```sql
CREATE TABLE events (
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
```

## Security Features

1. **App Isolation**: All queries are scoped to the requesting app's data
2. **Authentication Required**: JWT + API key validation
3. **Query Validation**: Custom queries must include app_id filter
4. **Input Sanitization**: All user inputs are validated and sanitized

## Performance Considerations

1. **Indexing**: Events table is partitioned by month and ordered by app_id, event_name, and timestamp
2. **Query Optimization**: Uses ClickHouse's columnar storage for efficient analytics
3. **Caching**: Consider implementing Redis caching for frequently accessed metrics
4. **Pagination**: Large result sets are paginated to prevent memory issues

## Error Handling

The system provides comprehensive error handling:

- Invalid app IDs return 400 Bad Request
- Missing data returns 404 Not Found
- Query errors return 500 Internal Server Error
- All errors are logged for debugging

## Monitoring and Logging

- All API calls are logged with request details
- Query execution times are tracked
- Error patterns are monitored
- Performance metrics are collected

## Future Enhancements

1. **Real-time Streaming**: WebSocket support for live event streaming
2. **Advanced Analytics**: Machine learning-based insights
3. **Custom Dashboards**: Configurable visualization dashboards
4. **Alerting**: Automated alerts for anomalies
5. **Data Export**: CSV/JSON export functionality
6. **Scheduled Reports**: Automated report generation

## Support

For questions or issues with the analytics system, please refer to the EventsHog documentation or contact the development team.
