import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.repository.update(userId, {
      password: hashedPassword,
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.repository.update(userId, {
      emailVerifiedAt: new Date(),
    });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findWithApps(userId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id: userId },
      relations: ['apps'],
    });
  }
} 