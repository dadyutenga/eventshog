import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetOtp } from '../entities/password-reset-otp.entity';
import { BaseRepository } from '../../../common/repository/base.repository';

@Injectable()
export class PasswordResetOtpRepository extends BaseRepository<PasswordResetOtp> {
  constructor(
    @InjectRepository(PasswordResetOtp)
    private readonly passwordResetOtpRepository: Repository<PasswordResetOtp>,
  ) {
    super(passwordResetOtpRepository);
  }

  async createOtp(userId: string, otp: string, expiresAt: Date): Promise<PasswordResetOtp> {
    const passwordResetOtp = this.passwordResetOtpRepository.create({
      userId,
      otp,
      expiresAt,
    });
    return this.passwordResetOtpRepository.save(passwordResetOtp);
  }

  async findValidOtp(userId: string, otp: string): Promise<PasswordResetOtp | null> {
    return this.passwordResetOtpRepository.findOne({
      where: {
        userId,
        otp,
        isUsed: false,
      },
    });
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await this.passwordResetOtpRepository.update(id, { isUsed: true });
  }

  async invalidateUserOtps(userId: string): Promise<void> {
    await this.passwordResetOtpRepository.update(
      { userId, isUsed: false },
      { isUsed: true }
    );
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.passwordResetOtpRepository.delete({
      expiresAt: new Date(),
      isUsed: false,
    });
  }
} 