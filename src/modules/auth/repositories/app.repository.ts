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
    // First get the current app to get the current event count
    const app = await this.repository.findOne({ where: { id: appId } });
    if (!app) {
      throw new Error(`App with id ${appId} not found`);
    }

    // Update with the incremented count
    await this.repository.update(appId, {
      eventCount: app.eventCount + 1,
      lastEventAt: new Date(),
    });
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