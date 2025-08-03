import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AppPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
  DESKTOP = 'desktop',
}

export enum AppStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('apps')
export class App {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AppPlatform,
  })
  platform: AppPlatform;

  @Column({
    type: 'enum',
    enum: AppStatus,
    default: AppStatus.ACTIVE,
  })
  status: AppStatus;

  @Column({ unique: true })
  @Index()
  apiKey: string;

  @Column({ unique: true })
  @Index()
  appId: string; // Unique identifier for the app

  @Column({ nullable: true })
  bundleId: string; // For mobile apps

  @Column({ nullable: true })
  websiteUrl: string; // For web apps

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: 0 })
  eventCount: number;

  @Column({ nullable: true })
  lastEventAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.apps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Virtual properties
  get isActive(): boolean {
    return this.status === AppStatus.ACTIVE;
  }

  get displayName(): string {
    return `${this.name} (${this.platform})`;
  }
} 