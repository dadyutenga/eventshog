import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppPlatform } from '../entities/app.entity';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}

export class CreateAppDto {
  @ApiProperty({ example: 'My Awesome App' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'A description of my app' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: AppPlatform, example: AppPlatform.WEB })
  @IsEnum(AppPlatform)
  platform: AppPlatform;

  @ApiPropertyOptional({ example: 'com.example.myapp' })
  @IsOptional()
  @IsString()
  bundleId?: string;

  @ApiPropertyOptional({ example: 'https://myapp.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png' })
  @IsOptional()
  @IsString()
  iconUrl?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid' },
      email: { type: 'string', example: 'user@example.com' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      role: { type: 'string', example: 'user' },
    },
  })
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
} 