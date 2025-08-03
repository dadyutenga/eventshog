import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const app = await this.authService.validateApiKey(apiKey);
    if (!app) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach app to request for use in controllers
    request.app = app;
    return true;
  }

  private extractApiKey(request: any): string | undefined {
    // Check Authorization header: Bearer <api-key>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    // Check query parameter
    if (request.query.api_key) {
      return request.query.api_key;
    }

    return undefined;
  }
} 