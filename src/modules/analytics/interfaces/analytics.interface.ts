export interface GenericEvent {
  id: string;
  app_id: string;
  event_name: string;
  user_id?: string;
  device_id?: string;
  session_id: string;
  timestamp: Date;
  properties: Record<string, any>;
  platform: string;
  version: string;
  created_at: Date;
}

export interface AnalyticsFilter {
  appId: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  deviceId?: string;
  eventName?: string;
  platform?: string;
  appVersion?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  uniqueDevices: number;
  eventBreakdown: Record<string, number>;
  platformBreakdown: Record<string, number>;
  versionBreakdown: Record<string, number>;
  timeSeriesData: Array<{ date: string; count: number }>;
}

export interface UserAnalytics {
  userId: string;
  deviceId: string;
  totalEvents: number;
  firstSeen: Date;
  lastSeen: Date;
  sessionCount: number;
  eventBreakdown: Record<string, number>;
  platform: string;
  appVersion: string;
}

export interface EventAnalytics {
  eventName: string;
  totalOccurrences: number;
  uniqueUsers: number;
  uniqueDevices: number;
  averageProperties: Record<string, any>;
  timeDistribution: Array<{ hour: number; count: number }>;
  userRetention: number;
}

export interface CustomQueryResult {
  data: any[];
  total: number;
  query: string;
  executionTime: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  eventsPerMinute: number;
  topEvents: Array<{ eventName: string; count: number }>;
  recentErrors: Array<{ eventName: string; count: number; lastOccurrence: Date }>;
}
