import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { 
  AnalyticsFilter, 
  GenericEvent, 
  UserAnalytics, 
  EventAnalytics,
  CustomQueryResult 
} from '../interfaces/analytics.interfaces';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getEvents(filter: AnalyticsFilter): Promise<GenericEvent[]> {
    try {
      this.logger.log(`Getting events for app ${filter.appId} with filters:`, {
        startDate: filter.startDate,
        endDate: filter.endDate,
        userId: filter.userId,
        eventName: filter.eventName,
        platform: filter.platform,
      });

      return await this.analyticsRepository.getEvents(filter);
    } catch (error) {
      this.logger.error('Failed to get events:', error);
      throw error;
    }
  }

  async getAnalyticsMetrics(filter: AnalyticsFilter): Promise<any> {
    try {
      this.logger.log(`Getting analytics metrics for app ${filter.appId}`);
      return await this.analyticsRepository.getAnalyticsMetrics(filter);
    } catch (error) {
      this.logger.error('Failed to get analytics metrics:', error);
      throw error;
    }
  }

  async getUserAnalytics(appId: string, userId: string, startDate?: Date, endDate?: Date): Promise<UserAnalytics> {
    try {
      this.logger.log(`Getting user analytics for app ${appId}, user ${userId}`);
      return await this.analyticsRepository.getUserAnalytics(appId, userId, startDate, endDate);
    } catch (error) {
      this.logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  async getEventAnalytics(appId: string, eventName: string, startDate?: Date, endDate?: Date): Promise<EventAnalytics> {
    try {
      this.logger.log(`Getting event analytics for app ${appId}, event ${eventName}`);
      return await this.analyticsRepository.getEventAnalytics(appId, eventName, startDate, endDate);
    } catch (error) {
      this.logger.error('Failed to get event analytics:', error);
      throw error;
    }
  }

  async executeCustomQuery(appId: string, query: string): Promise<CustomQueryResult> {
    try {
      this.logger.log(`Executing custom query for app ${appId}`);
      const startTime = Date.now();
      
      const data = await this.analyticsRepository.executeCustomQuery(appId, query);
      const executionTime = Date.now() - startTime;

      return {
        data,
        total: data.length,
        query,
        executionTime,
      };
    } catch (error) {
      this.logger.error('Failed to execute custom query:', error);
      throw error;
    }
  }

  async getRealTimeMetrics(appId: string): Promise<any> {
    try {
      this.logger.log(`Getting real-time metrics for app ${appId}`);
      return await this.analyticsRepository.getRealTimeMetrics(appId);
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }

  // Business logic methods for common analytics use cases
  async getContentPerformance(appId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      this.logger.log(`Getting content performance for app ${appId}`);
      
      // Get content-related events
      const contentEvents = await this.analyticsRepository.getEvents({
        appId,
        startDate,
        endDate,
        eventName: 'EPISODE_OPENED', // This will be generic for any app
      });

      // Group by content ID and analyze
      const contentMap = new Map();
      
      contentEvents.forEach(event => {
        const contentId = event.properties?.episode_id || event.properties?.content_id || 'unknown';
        
        if (!contentMap.has(contentId)) {
          contentMap.set(contentId, {
            contentId,
            title: event.properties?.episode_title || event.properties?.title || 'Unknown',
            opens: 0,
            uniqueUsers: new Set(),
            platforms: new Set(),
            versions: new Set(),
          });
        }
        
        const content = contentMap.get(contentId);
        content.opens++;
        if (event.user_id) content.uniqueUsers.add(event.user_id);
        content.platforms.add(event.platform);
        content.versions.add(event.version);
      });

      // Convert to array and calculate metrics
      const contentPerformance = Array.from(contentMap.values()).map(content => ({
        contentId: content.contentId,
        title: content.title,
        totalOpens: content.opens,
        uniqueUsers: content.uniqueUsers.size,
        platforms: Array.from(content.platforms),
        versions: Array.from(content.versions),
      }));

      return contentPerformance.sort((a, b) => b.totalOpens - a.totalOpens);
    } catch (error) {
      this.logger.error('Failed to get content performance:', error);
      throw error;
    }
  }

  async getUserEngagement(appId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      this.logger.log(`Getting user engagement for app ${appId}`);
      
      const metrics = await this.analyticsRepository.getAnalyticsMetrics({
        appId,
        startDate,
        endDate,
      });

      // Calculate engagement metrics
      const totalEvents = metrics.totalEvents;
      const uniqueUsers = metrics.uniqueUsers;
      const uniqueDevices = metrics.uniqueDevices;

      const engagementMetrics = {
        eventsPerUser: uniqueUsers > 0 ? totalEvents / uniqueUsers : 0,
        eventsPerDevice: uniqueDevices > 0 ? totalEvents / uniqueDevices : 0,
        userRetention: 0, // TODO: Implement retention calculation
        sessionMetrics: {
          totalSessions: 0, // TODO: Implement session calculation
          averageSessionLength: 0,
        },
        topUserActions: metrics.eventBreakdown,
        platformEngagement: metrics.platformBreakdown,
        versionEngagement: metrics.versionBreakdown,
      };

      return engagementMetrics;
    } catch (error) {
      this.logger.error('Failed to get user engagement:', error);
      throw error;
    }
  }

  async getErrorAnalytics(appId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      this.logger.log(`Getting error analytics for app ${appId}`);
      
      // Get error events (assuming they contain 'ERROR' in the name)
      const errorEvents = await this.analyticsRepository.getEvents({
        appId,
        startDate,
        endDate,
        eventName: 'API_ERROR', // Generic error event name
      });

      const errorAnalytics: any = {
        totalErrors: errorEvents.length,
        errorTypes: {},
        affectedEndpoints: {},
        userImpact: {},
        errorTrends: [],
        topErrors: [],
      };

      // Analyze error patterns
      errorEvents.forEach(event => {
        const errorType = event.properties?.error_type || 'unknown';
        const endpoint = event.properties?.endpoint || 'unknown';
        const userImpact = event.properties?.user_impact || 'unknown';

        // Count error types
        errorAnalytics.errorTypes[errorType] = (errorAnalytics.errorTypes[errorType] || 0) + 1;
        
        // Count affected endpoints
        errorAnalytics.affectedEndpoints[endpoint] = (errorAnalytics.affectedEndpoints[endpoint] || 0) + 1;
        
        // Count user impact
        errorAnalytics.userImpact[userImpact] = (errorAnalytics.userImpact[userImpact] || 0) + 1;
      });

      // Get top errors
      const errorTypeEntries = Object.entries(errorAnalytics.errorTypes);
      errorAnalytics.topErrors = errorTypeEntries
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([type, count]) => ({ type, count: count as number }));

      return errorAnalytics;
    } catch (error) {
      this.logger.error('Failed to get error analytics:', error);
      throw error;
    }
  }

  async getConversionFunnel(appId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      this.logger.log(`Getting conversion funnel for app ${appId}`);
      
      // This is a generic approach - apps can customize based on their specific events
      const funnelEvents = await this.analyticsRepository.getEvents({
        appId,
        startDate,
        endDate,
      });

      // Group events by user and create funnel
      const userFunnels = new Map();
      
      funnelEvents.forEach(event => {
        if (!event.user_id) return;
        
        if (!userFunnels.has(event.user_id)) {
          userFunnels.set(event.user_id, {
            userId: event.user_id,
            events: [],
            conversionStep: 0,
          });
        }
        
        const userFunnel = userFunnels.get(event.user_id);
        userFunnel.events.push({
          eventName: event.event_name,
          timestamp: event.timestamp,
          properties: event.properties,
        });
      });

      // Calculate conversion metrics
      const conversionMetrics = {
        totalUsers: userFunnels.size,
        funnelSteps: [],
        conversionRates: {},
      };

      return conversionMetrics;
    } catch (error) {
      this.logger.error('Failed to get conversion funnel:', error);
      throw error;
    }
  }
}
