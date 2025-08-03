import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { App, AppStatus } from '../entities/app.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AppRepository {
  constructor(
    @InjectRepository(App)
    private readonly repository: Repository<App>,
  ) {}

  async findById(id: string): Promise<App | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByApiKey(apiKey: string): Promise<App | null> {
    return this.repository.findOne({ where: { apiKey } });
  }

  async findByAppId(appId: string): Promise<App | null> {
    return this.repository.findOne({ where: { appId } });
  }

  async findByUserId(userId: string): Promise<App[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(appData: Partial<App>): Promise<App> {
    const app = this.repository.create({
      ...appData,
      apiKey: this.generateApiKey(),
      appId: this.generateAppId(),
    });
    return this.repository.save(app);
  }

  async update(id: string, updateData: Partial<App>): Promise<void> {
    await this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async incrementEventCount(appId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(App)
      .set({
        eventCount: () => 'event_count + 1',
        lastEventAt: new Date(),
      })
      .where('id = :id', { id: appId })
      .execute();
  }

  private generateApiKey(): string {
    return `eh_${randomBytes(32).toString('hex')}`;
  }

  private generateAppId(): string {
    return `app_${randomBytes(16).toString('hex')}`;
  }

  async findActiveApps(): Promise<App[]> {
    return this.repository.find({
      where: { status: AppStatus.ACTIVE },
      relations: ['user'],
    });
  }
} 