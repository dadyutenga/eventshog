import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { PasswordResetOtpRepository } from '../repositories/password-reset-otp.repository';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    private userRepository: UserRepository,
    private passwordResetOtpRepository: PasswordResetOtpRepository,
  ) {}

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;
    
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If the email exists, a password reset OTP has been sent.' };
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing OTPs for this user
    await this.passwordResetOtpRepository.invalidateUserOtps(user.id);

    // Create new OTP
    await this.passwordResetOtpRepository.createOtp(user.id, otp, expiresAt);

    // send otp to user later via email/sms
    this.logger.log(`Password reset OTP for user ${user.id}: ${otp}`);

    return { message: 'If the email exists, a password reset OTP has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, otp, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find valid OTP
    const otpRecord = await this.passwordResetOtpRepository.findValidOtp(user.id, otp);
    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Hash new password
    const hashedPassword = await this.userRepository.hashPassword(newPassword);

    // Update user password
    await this.userRepository.updatePassword(user.id, hashedPassword);

    // Mark OTP as used
    await this.passwordResetOtpRepository.markOtpAsUsed(otpRecord.id);

    // Invalidate any remaining OTPs for this user
    await this.passwordResetOtpRepository.invalidateUserOtps(user.id);

    return { message: 'Password has been reset successfully' };
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private get logger() {
    return {
      log: (message: string) => {
        // In production, this would be replaced with proper logging
        console.log(`[PasswordResetService] ${message}`);
      }
    };
  }
} 