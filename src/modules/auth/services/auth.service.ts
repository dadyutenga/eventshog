import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { AppRepository } from '../repositories/app.repository';
import { User } from '../entities/user.entity';
import { App, AppStatus } from '../entities/app.entity';
import { LoginDto, RegisterDto, CreateAppDto, ChangePasswordDto } from '../dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private appRepository: AppRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.userRepository.hashPassword(registerDto.password);
    
    const user = await this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await this.userRepository.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async createApp(userId: string, createAppDto: CreateAppDto): Promise<App> {
    const app = await this.appRepository.create({
      ...createAppDto,
      userId,
    });

    return app;
  }

  async getUserApps(userId: string): Promise<App[]> {
    return this.appRepository.findByUserId(userId);
  }

  async getAppById(userId: string, appId: string): Promise<App> {
    const app = await this.appRepository.findById(appId);
    if (!app || app.userId !== userId) {
      throw new NotFoundException('App not found');
    }
    return app;
  }

  async updateApp(userId: string, appId: string, updateData: Partial<App>): Promise<App> {
    const app = await this.getAppById(userId, appId);
    await this.appRepository.update(appId, updateData);
    const updatedApp = await this.appRepository.findById(appId);
    return updatedApp!;
  }

  async deleteApp(userId: string, appId: string): Promise<void> {
    await this.getAppById(userId, appId); // Verify ownership
    await this.appRepository.delete(appId);
  }

  async regenerateApiKey(userId: string, appId: string): Promise<{ apiKey: string }> {
    await this.getAppById(userId, appId); // Verify ownership
    const newApiKey = `eh_${require('crypto').randomBytes(32).toString('hex')}`;
    await this.appRepository.update(appId, { apiKey: newApiKey });
    return { apiKey: newApiKey };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this.userRepository.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await this.userRepository.hashPassword(changePasswordDto.newPassword);
    await this.userRepository.updatePassword(userId, hashedNewPassword);
  }

  async validateApiKey(apiKey: string): Promise<App | null> {
    const app = await this.appRepository.findByApiKey(apiKey);
    if (!app || app.status !== AppStatus.ACTIVE) {
      return null;
    }
    return app;
  }

  async incrementEventCount(appId: string): Promise<void> {
    await this.appRepository.incrementEventCount(appId);
  }

  private generateTokens(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 