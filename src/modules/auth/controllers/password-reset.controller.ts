import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PasswordResetService } from '../services/password-reset.service';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto/auth.dto';

@ApiTags('Password Reset')
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset OTP sent if email exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.passwordResetService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP or expired' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(resetPasswordDto);
  }
} 