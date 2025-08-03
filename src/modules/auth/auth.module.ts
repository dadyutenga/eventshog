import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { User } from './entities/user.entity';

import { UserRepository } from './repositories/user.repository';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { App } from './entities/app.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { AppRepository } from './repositories/app.repository';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, App]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
          issuer: 'eventshog',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    UserRepository,
    AppRepository,
    JwtAuthGuard,
    ApiKeyGuard,
  ],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, ApiKeyGuard],
})
export class AuthModule {} 