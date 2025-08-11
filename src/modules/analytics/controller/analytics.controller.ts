import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Query, 
    Param, 
    UseGuards, 
    Logger,
    HttpException,
    HttpStatus 
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { AnalyticsService } from '../services/analytics.service';
  import { 
    AnalyticsFilterDto, 
    CustomQueryDto, 
    EventQueryDto, 
    UserJourneyDto 
  } from '../dto/analytics.dto';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
  
  @ApiTags('Analytics')
  @Controller('analytics')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  @ApiBearerAuth()
  export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);
  
    constructor(private readonly analyticsService: AnalyticsService) {}
  
    @Get('events')
    @ApiOperation({ summary: 'Get events with filters' })
    @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getEvents(@Query() filter: AnalyticsFilterDto) {
      try {
        const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
        const endDate = filter.endDate ? new Date(filter.endDate) : undefined;
  
        return await this.analyticsService.getEvents({
          ...filter,
          startDate,
          endDate,
        });
      } catch (error) {
        this.logger.error('Failed to get events:', error);
        throw new HttpException(
          'Failed to retrieve events',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('metrics')
    @ApiOperation({ summary: 'Get analytics metrics' })
    @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getAnalyticsMetrics(@Query() filter: AnalyticsFilterDto) {
      try {
        const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
        const endDate = filter.endDate ? new Date(filter.endDate) : undefined;
  
        return await this.analyticsService.getAnalyticsMetrics({
          ...filter,
          startDate,
          endDate,
        });
      } catch (error) {
        this.logger.error('Failed to get analytics metrics:', error);
        throw new HttpException(
          'Failed to retrieve analytics metrics',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('users/:userId')
    @ApiOperation({ summary: 'Get user analytics' })
    @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserAnalytics(
      @Query('appId') appId: string,
      @Param('userId') userId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
  
        return await this.analyticsService.getUserAnalytics(appId, userId, start, end);
      } catch (error) {
        this.logger.error('Failed to get user analytics:', error);
        if (error.message.includes('No events found')) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to retrieve user analytics',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('events/:eventName')
    @ApiOperation({ summary: 'Get event analytics' })
    @ApiResponse({ status: 200, description: 'Event analytics retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    async getEventAnalytics(
      @Query('appId') appId: string,
      @Param('eventName') eventName: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
  
        return await this.analyticsService.getEventAnalytics(appId, eventName, start, end);
      } catch (error) {
        this.logger.error('Failed to get event analytics:', error);
        if (error.message.includes('No events found')) {
          throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to retrieve event analytics',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Post('custom-query')
    @ApiOperation({ summary: 'Execute custom analytics query' })
    @ApiResponse({ status: 200, description: 'Query executed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request or invalid query' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async executeCustomQuery(@Body() queryDto: CustomQueryDto) {
      try {
        return await this.analyticsService.executeCustomQuery(queryDto.appId, queryDto.query);
      } catch (error) {
        this.logger.error('Failed to execute custom query:', error);
        if (error.message.includes('must include app_id filter')) {
          throw new HttpException(
            'Custom query must include app_id filter for security',
            HttpStatus.BAD_REQUEST
          );
        }
        throw new HttpException(
          'Failed to execute custom query',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('real-time')
    @ApiOperation({ summary: 'Get real-time metrics' })
    @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getRealTimeMetrics(@Query('appId') appId: string) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        return await this.analyticsService.getRealTimeMetrics(appId);
      } catch (error) {
        this.logger.error('Failed to get real-time metrics:', error);
        throw new HttpException(
          'Failed to retrieve real-time metrics',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('content-performance')
    @ApiOperation({ summary: 'Get content performance analytics' })
    @ApiResponse({ status: 200, description: 'Content performance retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getContentPerformance(
      @Query('appId') appId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
  
        return await this.analyticsService.getContentPerformance(appId, start, end);
      } catch (error) {
        this.logger.error('Failed to get content performance:', error);
        throw new HttpException(
          'Failed to retrieve content performance',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('user-engagement')
    @ApiOperation({ summary: 'Get user engagement analytics' })
    @ApiResponse({ status: 200, description: 'User engagement retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserEngagement(
      @Query('appId') appId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
  
        return await this.analyticsService.getUserEngagement(appId, start, end);
      } catch (error) {
        this.logger.error('Failed to get user engagement:', error);
        throw new HttpException(
          'Failed to retrieve user engagement',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('error-analytics')
    @ApiOperation({ summary: 'Get error analytics' })
    @ApiResponse({ status: 200, description: 'Error analytics retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getErrorAnalytics(
      @Query('appId') appId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
  
        return await this.analyticsService.getErrorAnalytics(appId, start, end);
      } catch (error) {
        this.logger.error('Failed to get error analytics:', error);
        throw new HttpException(
          'Failed to retrieve error analytics',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get('conversion-funnel')
    @ApiOperation({ summary: 'Get conversion funnel analytics' })
    @ApiResponse({ status: 200, description: 'Conversion funnel retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getConversionFunnel(
      @Query('appId') appId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        if (!appId) {
          throw new HttpException('App ID is required', HttpStatus.BAD_REQUEST);
        }
  
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
  
        return await this.analyticsService.getConversionFunnel(appId, start, end);
      } catch (error) {
        this.logger.error('Failed to get conversion funnel:', error);
        throw new HttpException(
          'Failed to retrieve conversion funnel',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }