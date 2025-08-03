import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, AuthResponse } from '../services/auth.service';
import {
  LoginDto,
  RegisterDto,
  CreateAppDto,
  RefreshTokenDto,
  ChangePasswordDto,
  AuthResponseDto,
} from '../dto/auth.dto';
import { App } from '../entities/app.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Put('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  // App Management Endpoints
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('apps')
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({
    status: 201,
    description: 'App created successfully',
    type: App,
  })
  async createApp(
    @Request() req,
    @Body() createAppDto: CreateAppDto,
  ): Promise<App> {
    return this.authService.createApp(req.user.id, createAppDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('apps')
  @ApiOperation({ summary: 'Get user apps' })
  @ApiResponse({
    status: 200,
    description: 'Apps retrieved successfully',
    type: [App],
  })
  async getUserApps(@Request() req): Promise<App[]> {
    return this.authService.getUserApps(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('apps/:id')
  @ApiOperation({ summary: 'Get app by ID' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({
    status: 200,
    description: 'App retrieved successfully',
    type: App,
  })
  @ApiResponse({ status: 404, description: 'App not found' })
  async getApp(@Request() req, @Param('id') appId: string): Promise<App> {
    return this.authService.getAppById(req.user.id, appId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Put('apps/:id')
  @ApiOperation({ summary: 'Update app' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({
    status: 200,
    description: 'App updated successfully',
    type: App,
  })
  @ApiResponse({ status: 404, description: 'App not found' })
  async updateApp(
    @Request() req,
    @Param('id') appId: string,
    @Body() updateData: Partial<App>,
  ): Promise<App> {
    return this.authService.updateApp(req.user.id, appId, updateData);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete('apps/:id')
  @ApiOperation({ summary: 'Delete app' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App deleted successfully' })
  @ApiResponse({ status: 404, description: 'App not found' })
  async deleteApp(@Request() req, @Param('id') appId: string): Promise<{ message: string }> {
    await this.authService.deleteApp(req.user.id, appId);
    return { message: 'App deleted successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('apps/:id/regenerate-api-key')
  @ApiOperation({ summary: 'Regenerate app API key' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({
    status: 200,
    description: 'API key regenerated successfully',
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'App not found' })
  async regenerateApiKey(
    @Request() req,
    @Param('id') appId: string,
  ): Promise<{ apiKey: string }> {
    return this.authService.regenerateApiKey(req.user.id, appId);
  }
} 