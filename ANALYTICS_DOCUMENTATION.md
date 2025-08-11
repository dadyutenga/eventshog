# EventsHog Analytics System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [API Reference](#api-reference)
4. [Authentication](#authentication)
5. [Usage Examples](#usage-examples)
6. [Data Structure](#data-structure)
7. [Security Features](#security-features)
8. [Performance & Best Practices](#performance--best-practices)
9. [Error Handling](#error-handling)
10. [Troubleshooting](#troubleshooting)

## Overview

The EventsHog Analytics System provides a comprehensive way for any app to consume and analyze their event data stored in ClickHouse. This system is designed to be generic and flexible, allowing different apps to track their specific events without hardcoding business logic.

### Key Features

- **Generic Event Analytics**: Works with any app's event structure
- **Real-time Metrics**: Live insights into app performance
- **User Journey Tracking**: Analyze individual user behavior patterns
- **Custom Queries**: Execute custom ClickHouse queries for specific needs
- **Content Performance**: Track content engagement and performance
- **Error Analytics**: Monitor and analyze error patterns
- **Conversion Funnels**: Understand user conversion paths
- **Multi-dimensional Filtering**: Filter by time, user, device, platform, etc.

## Getting Started

### Prerequisites

- EventsHog account with ClickHouse integration
- Valid API key and JWT token
- App ID configured in EventsHog

### Base URL

```
https://api.eventshog.makazii.app/analytics
```

### Quick Start

1. **Authenticate**: Get your JWT token and API key
2. **Identify Your App**: Use your app ID in all requests
3. **Start Querying**: Begin with basic metrics and expand

## API Reference

### Authentication

All endpoints require both JWT authentication and API key validation.

**Headers Required:**

```
Authorization: Bearer <JWT_TOKEN>
X-API-Key: <API_KEY>
```

### 1. Get Events

Retrieve filtered events with comprehensive filtering options.

```http
GET /analytics/events
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |
| `userId` | string | ❌ | Filter by specific user |
| `deviceId` | string | ❌ | Filter by specific device |
| `eventName` | string | ❌ | Filter by event type |
| `platform` | string | ❌ | Filter by platform |
| `version` | string | ❌ | Filter by app version |
| `limit` | number | ❌ | Results limit (default: 100) |
| `offset` | number | ❌ | Pagination offset (default: 0) |

**Example Response:**

```json
[
  {
    "id": "uuid-123",
    "app_id": "myapp",
    "event_name": "USER_LOGIN",
    "user_id": "user_123",
    "device_id": "device_abc",
    "session_id": "session_xyz",
    "timestamp": "2024-01-15T10:30:00Z",
    "properties": {
      "login_method": "phone_otp",
      "is_new_device": false
    },
    "platform": "ios",
    "version": "2.0.1",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 2. Get Analytics Metrics

Get comprehensive analytics metrics and breakdowns.

```http
GET /analytics/metrics
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
{
  "totalEvents": 15420,
  "uniqueUsers": 3420,
  "uniqueDevices": 3890,
  "eventBreakdown": {
    "USER_LOGIN": 1200,
    "EPISODE_OPENED": 8900,
    "EPISODE_COMPLETED": 4500,
    "PAYWALL_VIEWED": 820
  },
  "platformBreakdown": {
    "ios": 8900,
    "android": 6520
  },
  "versionBreakdown": {
    "2.0.1": 12000,
    "2.0.0": 3420
  },
  "timeSeriesData": [
    {
      "date": "2024-01-15",
      "count": 1200
    }
  ]
}
```

### 3. Get User Analytics

Get detailed analytics for a specific user.

```http
GET /analytics/users/{userId}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ | User identifier |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
{
  "userId": "user_123",
  "deviceId": "device_abc",
  "totalEvents": 45,
  "firstSeen": "2024-01-01T10:00:00Z",
  "lastSeen": "2024-01-15T18:30:00Z",
  "sessionCount": 12,
  "eventBreakdown": {
    "USER_LOGIN": 5,
    "EPISODE_OPENED": 25,
    "EPISODE_COMPLETED": 15
  },
  "platform": "ios",
  "appVersion": "2.0.1"
}
```

### 4. Get Event Analytics

Get analytics for a specific event type.

```http
GET /analytics/events/{eventName}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventName` | string | ✅ | Event name to analyze |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
{
  "eventName": "EPISODE_OPENED",
  "totalOccurrences": 8900,
  "uniqueUsers": 3200,
  "uniqueDevices": 3500,
  "averageProperties": {},
  "timeDistribution": [
    {
      "hour": 10,
      "count": 1200
    }
  ],
  "userRetention": 0.85
}
```

### 5. Execute Custom Query

Execute custom ClickHouse queries for specific analysis needs.

```http
POST /analytics/custom-query
```

**Request Body:**

```json
{
  "appId": "myapp",
  "query": "SELECT event_name, count() as count FROM events WHERE app_id = 'myapp' AND timestamp >= '2024-01-01' GROUP BY event_name ORDER BY count DESC"
}
```

**Security Restrictions:**

- Only `SELECT` queries are allowed
- Must include `app_id = '{appId}'` filter
- Forbidden keywords: `CREATE`, `UPDATE`, `DELETE`, `INSERT`, `DROP`, `ALTER`, `TRUNCATE`, `REPLACE`

**Example Response:**

```json
{
  "data": [
    {
      "event_name": "EPISODE_OPENED",
      "count": "8900"
    }
  ],
  "total": 1,
  "query": "SELECT event_name, count() as count FROM events WHERE app_id = 'myapp' AND timestamp >= '2024-01-01' GROUP BY event_name ORDER BY count DESC",
  "executionTime": 45
}
```

### 6. Get Real-time Metrics

Get live metrics and current app performance.

```http
GET /analytics/real-time
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |

**Example Response:**

```json
{
  "activeUsers": 156,
  "eventsPerMinute": 89,
  "topEvents": [
    {
      "eventName": "EPISODE_OPENED",
      "count": 45
    }
  ],
  "recentErrors": [
    {
      "eventName": "API_ERROR",
      "count": 3,
      "lastOccurrence": "2024-01-15T18:25:00Z"
    }
  ]
}
```

### 7. Get Content Performance

Analyze content engagement and performance.

```http
GET /analytics/content-performance
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
[
  {
    "contentId": "episode_001",
    "title": "The Mystery Begins",
    "totalOpens": 1200,
    "uniqueUsers": 890,
    "platforms": ["ios", "android"],
    "versions": ["2.0.1", "2.0.0"]
  }
]
```

### 8. Get User Engagement

Get comprehensive user engagement metrics.

```http
GET /analytics/user-engagement
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
{
  "eventsPerUser": 4.5,
  "eventsPerDevice": 3.9,
  "userRetention": 0.78,
  "sessionMetrics": {
    "totalSessions": 0,
    "averageSessionLength": 0
  },
  "topUserActions": {
    "EPISODE_OPENED": 8900,
    "USER_LOGIN": 1200
  },
  "platformEngagement": {
    "ios": 8900,
    "android": 6520
  },
  "versionEngagement": {
    "2.0.1": 12000,
    "2.0.0": 3420
  }
}
```

### 9. Get Error Analytics

Analyze error patterns and user impact.

```http
GET /analytics/error-analytics
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
{
  "totalErrors": 156,
  "errorTypes": {
    "network_timeout": 89,
    "validation_error": 45,
    "server_error": 22
  },
  "affectedEndpoints": {
    "/api/articles": 89,
    "/api/user/profile": 45
  },
  "userImpact": {
    "content_not_loaded": 89,
    "login_failed": 45
  },
  "errorTrends": [],
  "topErrors": [
    {
      "type": "network_timeout",
      "count": 89
    }
  ]
}
```

### 10. Get Conversion Funnel

Analyze user conversion paths and drop-off points.

```http
GET /analytics/conversion-funnel
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | ✅ | The app identifier |
| `startDate` | string | ❌ | Start date (ISO string) |
| `endDate` | string | ❌ | End date (ISO string) |

**Example Response:**

```json
{
  "totalUsers": 3420,
  "funnelSteps": [],
  "conversionRates": {}
}
```

## Usage Examples

### For Kijiweni App

#### Track User Behavior

```bash
# Get all user login events for the last 7 days
curl -X GET "https://api.eventshog.makazii.app/analytics/events?appId=kijiweni&eventName=USER_LOGIN&startDate=2024-01-08T00:00:00Z&endDate=2024-01-15T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"

# Analyze user engagement patterns
curl -X GET "https://api.eventshog.makazii.app/analytics/user-engagement?appId=kijiweni&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Monitor Content Performance

```bash
# Track episode engagement
curl -X GET "https://api.eventshog.makazii.app/analytics/content-performance?appId=kijiweni&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"

# Analyze specific episode performance
curl -X GET "https://api.eventshog.makazii.app/analytics/events?appId=kijiweni&eventName=EPISODE_OPENED&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Real-time Monitoring

```bash
# Get live user activity
curl -X GET "https://api.eventshog.makazii.app/analytics/real-time?appId=kijiweni" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Custom Analysis

```bash
# Execute custom queries for specific business needs
curl -X POST "https://api.eventshog.makazii.app/analytics/custom-query" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "kijiweni",
    "query": "SELECT event_name, count() as count FROM events WHERE app_id = '\''kijiweni'\'' AND event_name LIKE '\''%EPISODE%'\'' GROUP BY event_name ORDER BY count DESC"
  }'
```

### For Any Other App

```bash
# Get all events for a different app
curl -X GET "https://api.eventshog.makazii.app/analytics/events?appId=myapp&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"

# Get metrics for a specific platform
curl -X GET "https://api.eventshog.makazii.app/analytics/metrics?appId=myapp&platform=ios&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"
```

## Data Structure

### Event Schema

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

### Properties Field

The `properties` field is a JSON object that can contain any app-specific data:

```json
{
  "episode_id": "episode_001",
  "episode_title": "The Mystery Begins",
  "content_type": "article",
  "story_name": "Detective Series",
  "read_duration": 1800,
  "completion_percentage": 100,
  "share_method": "whatsapp",
  "plan_id": "plan_premium",
  "plan_price": 999,
  "error_type": "network_timeout",
  "endpoint": "/api/articles",
  "error_code": 408,
  "user_impact": "content_not_loaded"
}
```

## Security Features

### 1. App Isolation

- All queries are scoped to the requesting app's data
- Apps cannot access data from other applications
- Cross-app data leakage is prevented

### 2. Authentication Required

- JWT token for user identity verification
- API key for app-level access control
- Both must be valid for any request

### 3. Query Validation

- Custom queries must include app_id filter
- Only SELECT operations are allowed
- Destructive operations are blocked

### 4. Input Sanitization

- All user inputs are validated and sanitized
- SQL injection prevention
- Parameter type checking

## Performance & Best Practices

### 1. Query Optimization

- Use date filters to limit data scope
- Leverage ClickHouse partitioning (monthly)
- Use appropriate LIMIT clauses for large datasets

### 2. Caching Strategy

- Cache frequently accessed metrics
- Implement Redis for real-time data
- Use CDN for static analytics data

### 3. Pagination

- Always use LIMIT and OFFSET for large result sets
- Default limit is 100 records
- Implement infinite scroll or pagination controls

### 4. Time-based Filtering

- Use specific date ranges for better performance
- Avoid querying entire datasets
- Leverage ClickHouse time-based partitioning

### 5. Custom Queries

- Keep queries simple and focused
- Use appropriate indexes
- Test query performance before production

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters or query
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Requested data not found
- `500 Internal Server Error`: Server-side error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Custom query must include app_id filter for security",
  "error": "Bad Request"
}
```

### Common Error Scenarios

1. **Missing App ID**: Returns 400 with clear error message
2. **Invalid Date Format**: Returns 400 for malformed ISO strings
3. **Unauthorized Access**: Returns 401 for invalid tokens
4. **Data Not Found**: Returns 404 when no events match criteria
5. **Query Validation Failed**: Returns 400 for forbidden operations

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem**: Getting 401 Unauthorized
**Solution**:

- Verify JWT token is valid and not expired
- Check API key is correct
- Ensure both headers are present

#### 2. App ID Filter Errors

**Problem**: Custom query fails with app_id filter error
**Solution**:

- Ensure query includes `app_id = 'your_app_id'`
- Check for proper quoting around app_id value
- Verify app_id matches your configured app

#### 3. Date Format Issues

**Problem**: Date parameters causing errors
**Solution**:

- Use ISO 8601 format: `2024-01-15T10:30:00Z`
- Ensure dates are properly URL encoded
- Check timezone handling

#### 4. Large Result Sets

**Problem**: Slow response times or timeouts
**Solution**:

- Use LIMIT and OFFSET for pagination
- Apply date filters to reduce data scope
- Consider using metrics endpoints instead of raw events

#### 5. Custom Query Restrictions

**Problem**: Query rejected due to forbidden keywords
**Solution**:

- Only use SELECT statements
- Avoid CREATE, UPDATE, DELETE, INSERT, DROP, ALTER
- Ensure query is read-only

### Performance Tips

1. **Use Specific Date Ranges**: Avoid querying entire datasets
2. **Leverage Aggregations**: Use metrics endpoints for summaries
3. **Implement Caching**: Cache frequently accessed data
4. **Monitor Query Performance**: Track execution times
5. **Use Appropriate Limits**: Don't fetch unnecessary data

### Debugging

1. **Check Logs**: Review server logs for detailed error information
2. **Validate Parameters**: Ensure all required parameters are present
3. **Test Queries**: Use simple queries first, then add complexity
4. **Monitor Performance**: Track response times and success rates
5. **Use Development Environment**: Test queries in non-production first

## Support & Resources

### Documentation

- [EventsHog Main Documentation](https://docs.eventshog.com)
- [ClickHouse Query Reference](https://clickhouse.com/docs/en/sql-reference)
- [API Best Practices Guide](https://docs.eventshog.com/analytics/best-practices)

### Community

- [EventsHog Community Forum](https://community.eventshog.com)
- [GitHub Issues](https://github.com/eventshog/eventshog/issues)
- [Discord Channel](https://discord.gg/eventshog)

### Contact

- **Technical Support**: support@eventshog.com
- **Sales Inquiries**: sales@eventshog.com
- **Feature Requests**: features@eventshog.com

---

_Last Updated: January 2024_
_Version: 1.0.0_
