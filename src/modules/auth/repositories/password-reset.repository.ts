import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from '../entities/password-reset.entity';

@Injectable()
export class PasswordResetRepository {
  constructor(
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
  ) {}

  async create(userId: string, otp: string, token: string, expiresAt: Date): Promise<PasswordReset> {
    const passwordReset = this.passwordResetRepository.create({
      userId,
      otp,
      token,
      expiresAt,
    });
    return this.passwordResetRepository.save(passwordReset);
  }

  async findByOtp(otp: string): Promise<PasswordReset | null> {
    return this.passwordResetRepository.findOne({
      where: { otp, used: false },
      relations: ['user'],
    });
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    return this.passwordResetRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.passwordResetRepository.update(id, { used: true });
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();
    await this.passwordResetRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.passwordResetRepository.delete({ userId });
  }
} 