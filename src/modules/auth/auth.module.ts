import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { User } from './entities/user.entity';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';

import { UserRepository } from './repositories/user.repository';
import { PasswordResetOtpRepository } from './repositories/password-reset-otp.repository';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ProjectKeyGuard } from './guards/project-key.guard';
import { App } from './entities/app.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { AppRepository } from './repositories/app.repository';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, App, PasswordResetOtp]),
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
  controllers: [AuthController, PasswordResetController],
  providers: [
    AuthService,
    PasswordResetService,
    JwtStrategy,
    LocalStrategy,
    UserRepository,
    AppRepository,
    PasswordResetOtpRepository,
    JwtAuthGuard,
    ApiKeyGuard,
    ProjectKeyGuard,
  ],
  exports: [AuthService, PasswordResetService, JwtStrategy, JwtAuthGuard, ApiKeyGuard, ProjectKeyGuard],
})
export class AuthModule {} 