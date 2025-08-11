import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '../../../core/clickhouse/clickhouse.service';
import { AnalyticsFilter, GenericEvent, UserAnalytics, EventAnalytics } from '../interfaces/analytics.interface';

@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);

  constructor(private readonly clickhouseService: ClickHouseService) {}

  async getEvents(filter: AnalyticsFilter): Promise<GenericEvent[]> {
    try {
      let query = `
        SELECT 
          id,
          app_id,
          event_name,
          user_id,
          device_id,
          session_id,
          timestamp,
          properties,
          platform,
          version,
          created_at
        FROM events 
        WHERE app_id = '${filter.appId}'
      `;

      const params: string[] = [];

      if (filter.startDate) {
        query += ` AND timestamp >= '${filter.startDate.toISOString()}'`;
      }

      if (filter.endDate) {
        query += ` AND timestamp <= '${filter.endDate.toISOString()}'`;
      }

      if (filter.userId) {
        query += ` AND user_id = '${filter.userId}'`;
      }

      if (filter.deviceId) {
        query += ` AND device_id = '${filter.deviceId}'`;
      }

      if (filter.eventName) {
        query += ` AND event_name = '${filter.eventName}'`;
      }

      if (filter.platform) {
        query += ` AND platform = '${filter.platform}'`;
      }

      if (filter.appVersion) {
        query += ` AND version = '${filter.appVersion}'`;
      }

      query += ` ORDER BY timestamp DESC`;

      if (filter.limit) {
        query += ` LIMIT ${filter.limit}`;
        if (filter.offset) {
          query += ` OFFSET ${filter.offset}`;
        }
      }

      this.logger.debug(`Executing query: ${query}`);
      const result = await this.clickhouseService.executeQuery(query);
      const data = Array.isArray(result) ? result : [];

      return data.map((row: any) => ({
        id: row.id,
        app_id: row.app_id,
        event_name: row.event_name,
        user_id: row.user_id,
        device_id: row.device_id,
        session_id: row.session_id,
        timestamp: new Date(row.timestamp),
        properties: row.properties,
        platform: row.platform,
        version: row.version,
        created_at: new Date(row.created_at),
      }));
    } catch (error) {
      this.logger.error('Failed to get events:', error);
      throw error;
    }
  }

  async getAnalyticsMetrics(filter: AnalyticsFilter): Promise<any> {
    try {
      const baseWhere = `WHERE app_id = '${filter.appId}'`;
      const dateFilter = filter.startDate && filter.endDate 
        ? `AND timestamp >= '${filter.startDate.toISOString()}' AND timestamp <= '${filter.endDate.toISOString()}'`
        : '';

      // Total events
      const totalEventsQuery = `
        SELECT count() as total
        FROM events 
        ${baseWhere} ${dateFilter}
      `;

      // Unique users
      const uniqueUsersQuery = `
        SELECT uniqExact(user_id) as unique_users
        FROM events 
        ${baseWhere} ${dateFilter}
        AND user_id IS NOT NULL
      `;

      // Unique devices
      const uniqueDevicesQuery = `
        SELECT uniqExact(device_id) as unique_devices
        FROM events 
        ${baseWhere} ${dateFilter}
        AND device_id IS NOT NULL
      `;

      // Event breakdown
      const eventBreakdownQuery = `
        SELECT 
          event_name,
          count() as count
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY event_name
        ORDER BY count DESC
      `;

      // Platform breakdown
      const platformBreakdownQuery = `
        SELECT 
          platform,
          count() as count
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY platform
        ORDER BY count DESC
      `;

      // Version breakdown
      const versionBreakdownQuery = `
        SELECT 
          version,
          count() as count
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY version
        ORDER BY count DESC
      `;

      // Time series data
      const timeSeriesQuery = `
        SELECT 
          toDate(timestamp) as date,
          count() as count
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY date
        ORDER BY date
      `;

      const [
        totalEvents,
        uniqueUsers,
        uniqueDevices,
        eventBreakdown,
        platformBreakdown,
        versionBreakdown,
        timeSeriesData
      ] = await Promise.all([
        this.clickhouseService.executeQuery(totalEventsQuery),
        this.clickhouseService.executeQuery(uniqueUsersQuery),
        this.clickhouseService.executeQuery(uniqueDevicesQuery),
        this.clickhouseService.executeQuery(eventBreakdownQuery),
        this.clickhouseService.executeQuery(platformBreakdownQuery),
        this.clickhouseService.executeQuery(versionBreakdownQuery),
        this.clickhouseService.executeQuery(timeSeriesQuery),
      ]);

      const totalEventsData = Array.isArray(totalEvents) ? totalEvents : [];
      const uniqueUsersData = Array.isArray(uniqueUsers) ? uniqueUsers : [];
      const uniqueDevicesData = Array.isArray(uniqueDevices) ? uniqueDevices : [];
      const eventBreakdownData = Array.isArray(eventBreakdown) ? eventBreakdown : [];
      const platformBreakdownData = Array.isArray(platformBreakdown) ? platformBreakdown : [];
      const versionBreakdownData = Array.isArray(versionBreakdown) ? versionBreakdown : [];
      const timeSeriesDataArray = Array.isArray(timeSeriesData) ? timeSeriesData : [];

      return {
        totalEvents: (totalEventsData[0] as any)?.total || 0,
        uniqueUsers: (uniqueUsersData[0] as any)?.unique_users || 0,
        uniqueDevices: (uniqueDevicesData[0] as any)?.unique_devices || 0,
        eventBreakdown: eventBreakdownData.reduce((acc: any, row: any) => {
          acc[row.event_name] = row.count;
          return acc;
        }, {}),
        platformBreakdown: platformBreakdownData.reduce((acc: any, row: any) => {
          acc[row.platform] = row.count;
          return acc;
        }, {}),
        versionBreakdown: versionBreakdownData.reduce((acc: any, row: any) => {
          acc[row.version] = row.count;
          return acc;
        }, {}),
        timeSeriesData: timeSeriesDataArray.map((row: any) => ({
          date: row.date,
          count: row.count,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get analytics metrics:', error);
      throw error;
    }
  }

  async getUserAnalytics(appId: string, userId: string, startDate?: Date, endDate?: Date): Promise<UserAnalytics> {
    try {
      const baseWhere = `WHERE app_id = '${appId}' AND user_id = '${userId}'`;
      const dateFilter = startDate && endDate 
        ? `AND timestamp >= '${startDate.toISOString()}' AND timestamp <= '${endDate.toISOString()}'`
        : '';

      const query = `
        SELECT 
          user_id,
          device_id,
          count() as total_events,
          min(timestamp) as first_seen,
          max(timestamp) as last_seen,
          uniqExact(session_id) as session_count,
          platform,
          version
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY user_id, device_id, platform, version
      `;

      const result = await this.clickhouseService.executeQuery(query);
      const resultData = Array.isArray(result) ? result : [];
      
      if (resultData.length === 0) {
        throw new Error(`No events found for user ${userId} in app ${appId}`);
      }

      const row = resultData[0] as any;

      // Get event breakdown for this user
      const eventBreakdownQuery = `
        SELECT 
          event_name,
          count() as count
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY event_name
        ORDER BY count DESC
      `;

      const eventBreakdown = await this.clickhouseService.executeQuery(eventBreakdownQuery);
      const eventBreakdownData = Array.isArray(eventBreakdown) ? eventBreakdown : [];

      return {
        userId: row.user_id,
        deviceId: row.device_id,
        totalEvents: row.total_events,
        firstSeen: new Date(row.first_seen),
        lastSeen: new Date(row.last_seen),
        sessionCount: row.session_count,
        eventBreakdown: (eventBreakdownData as any[]).reduce((acc: Record<string, number>, eventRow: any) => {
          acc[eventRow.event_name] = eventRow.count;
          return acc;
        }, {} as Record<string, number>),
        platform: row.platform,
        appVersion: row.version,
      };
    } catch (error) {
      this.logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  async getEventAnalytics(appId: string, eventName: string, startDate?: Date, endDate?: Date): Promise<EventAnalytics> {
    try {
      const baseWhere = `WHERE app_id = '${appId}' AND event_name = '${eventName}'`;
      const dateFilter = startDate && endDate 
        ? `AND timestamp >= '${startDate.toISOString()}' AND timestamp <= '${endDate.toISOString()}'`
        : '';

      const query = `
        SELECT 
          event_name,
          count() as total_occurrences,
          uniqExact(user_id) as unique_users,
          uniqExact(device_id) as unique_devices
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY event_name
      `;

      const result = await this.clickhouseService.executeQuery(query);
      const resultData = Array.isArray(result) ? result : [];
      
      if (resultData.length === 0) {
        throw new Error(`No events found for event ${eventName} in app ${appId}`);
      }

      const row = result[0];

      // Get time distribution
      const timeDistributionQuery = `
        SELECT 
          toHour(timestamp) as hour,
          count() as count
        FROM events 
        ${baseWhere} ${dateFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const timeDistribution = await this.clickhouseService.executeQuery(timeDistributionQuery);

      return {
        eventName: row.event_name,
        totalOccurrences: row.total_occurrences,
        uniqueUsers: row.unique_users,
        uniqueDevices: row.unique_devices,
        averageProperties: {}, // TODO: Implement properties analysis
        timeDistribution: (timeDistribution as any[]).map((row: any) => ({
          hour: row.hour,
          count: row.count,
        })),
        userRetention: 0, // TODO: Implement retention calculation
      };
    } catch (error) {
      this.logger.error('Failed to get event analytics:', error);
      throw error;
    }
  }

  async executeCustomQuery(appId: string, query: string): Promise<any> {
    try {
      // Validate that the query contains the app_id filter for security
      if (!query.toLowerCase().includes(`app_id = '${appId}'`)) {
        throw new Error('Custom query must include app_id filter for security');
      }

      // Prevent destructive operations - only allow SELECT queries
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT queries are allowed for analytics. Destructive operations (CREATE, UPDATE, DELETE, INSERT, DROP, ALTER) are not permitted.');
      }

      // Check for forbidden keywords
      const forbiddenKeywords = ['create', 'update', 'delete', 'insert', 'drop', 'alter', 'truncate', 'replace'];
      if (forbiddenKeywords.some(keyword => trimmedQuery.includes(keyword))) {
        throw new Error('Query contains forbidden keywords. Only SELECT queries are allowed for analytics.');
      }

      this.logger.debug(`Executing custom query: ${query}`);
      const result = await this.clickhouseService.executeQuery(query);
      return result;
    } catch (error) {
      this.logger.error('Failed to execute custom query:', error);
      throw error;
    }
  }

  async getRealTimeMetrics(appId: string): Promise<any> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // Active users in last hour
      const activeUsersQuery = `
        SELECT uniqExact(user_id) as active_users
        FROM events 
        WHERE app_id = '${appId}' 
        AND timestamp >= '${oneHourAgo.toISOString()}'
        AND user_id IS NOT NULL
      `;

      // Events per minute
      const eventsPerMinuteQuery = `
        SELECT count() as events_per_minute
        FROM events 
        WHERE app_id = '${appId}' 
        AND timestamp >= '${oneMinuteAgo.toISOString()}'
      `;

      // Top events in last hour
      const topEventsQuery = `
        SELECT 
          event_name,
          count() as count
        FROM events 
        WHERE app_id = '${appId}' 
        AND timestamp >= '${oneHourAgo.toISOString()}'
        GROUP BY event_name
        ORDER BY count DESC
        LIMIT 5
      `;

      // Recent errors
      const recentErrorsQuery = `
        SELECT 
          event_name,
          count() as count,
          max(timestamp) as last_occurrence
        FROM events 
        WHERE app_id = '${appId}' 
        AND timestamp >= '${oneHourAgo.toISOString()}'
        AND event_name LIKE '%ERROR%'
        GROUP BY event_name
        ORDER BY count DESC
        LIMIT 5
      `;

      const [
        activeUsers,
        eventsPerMinute,
        topEvents,
        recentErrors
      ] = await Promise.all([
        this.clickhouseService.executeQuery(activeUsersQuery),
        this.clickhouseService.executeQuery(eventsPerMinuteQuery),
        this.clickhouseService.executeQuery(topEventsQuery),
        this.clickhouseService.executeQuery(recentErrorsQuery),
      ]);

      return {
        activeUsers: activeUsers[0]?.active_users || 0,
        eventsPerMinute: eventsPerMinute[0]?.events_per_minute || 0,
        topEvents: (topEvents as any[]).map((row: any) => ({
          eventName: row.event_name,
          count: row.count,
        })),
        recentErrors: (recentErrors as any[]).map((row: any) => ({
          eventName: row.event_name,
          count: row.count,
          lastOccurrence: new Date(row.last_occurrence),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }
}
