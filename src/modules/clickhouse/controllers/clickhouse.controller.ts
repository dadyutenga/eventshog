import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClickHouseService } from '../../../core/clickhouse/clickhouse.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateDatabaseDto, ExecuteQueryDto } from '../dto/clickhouse.dto';

@ApiTags('ClickHouse')
@Controller('clickhouse')
export class ClickHouseController {
  constructor(private clickHouseService: ClickHouseService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test ClickHouse connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection() {
    const isConnected = await this.clickHouseService.testConnection();
    return {
      connected: isConnected,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('create-database')
  @ApiOperation({ summary: 'Create a new database for tenant' })
  @ApiResponse({ status: 201, description: 'Database created successfully' })
  async createDatabase(@Body() createDatabaseDto: CreateDatabaseDto) {
    await this.clickHouseService.createDatabase(createDatabaseDto.databaseName);
    await this.clickHouseService.createEventsTable(createDatabaseDto.databaseName);
    
    return {
      message: 'Database and events table created successfully',
      databaseName: createDatabaseDto.databaseName,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('query')
  @ApiOperation({ summary: 'Execute a ClickHouse query' })
  @ApiResponse({ status: 200, description: 'Query executed successfully' })
  async executeQuery(@Body() executeQueryDto: ExecuteQueryDto) {
    const result = await this.clickHouseService.executeQuery(executeQueryDto.query, executeQueryDto.format);
    return {
      result,
      query: executeQueryDto.query,
    };
  }
} 