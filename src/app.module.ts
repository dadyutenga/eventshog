import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import databaseConfig from './core/database/database.config';
import clickhouseConfig from './core/clickhouse/clickhouse.config';
import kafkaConfig from './core/kafka/kafka.config';
import { AuthModule } from './modules/auth/auth.module';
import { ClickHouseModule } from './core/clickhouse/clickhouse.module';
import { KafkaModule } from './core/kafka/kafka.module';
import { KafkaProducerModule } from './modules/kafka-producer/kafka-producer.module';
import { EventsModule } from './modules/events/events.module';
import { validate } from './config/env.validation';
import { AnalyticsModule } from './modules/analytics/analytics.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, clickhouseConfig, kafkaConfig],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const config = configService.get<TypeOrmModuleOptions>('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return config;
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    ClickHouseModule,
    KafkaModule,
    KafkaProducerModule,
    EventsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
