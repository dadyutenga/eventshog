import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ProjectKeyGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectKey = this.extractProjectKey(request);

    if (!projectKey) {
      throw new UnauthorizedException('Project key is required');
    }

    const app = await this.authService.validateProjectKey(projectKey);
    if (!app) {
      throw new UnauthorizedException('Invalid project key');
    }

    // Attach app to request for use in controllers
    request.app = app;
    return true;
  }

  private extractProjectKey(request: any): string | undefined {
    // Check body parameter first (for POST requests) - highest priority
    if (request.body && request.body.projectKey) {
      return request.body.projectKey;
    }

    // Check X-Project-Key header
    if (request.headers['x-project-key']) {
      return request.headers['x-project-key'];
    }

    // Check query parameter
    if (request.query.project_key) {
      return request.query.project_key;
    }

    // Check Authorization header: Bearer <project-key>
    // Only if it doesn't look like a JWT token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // JWT tokens have 3 parts separated by dots and are much longer
      // Project keys start with 'app_' and are shorter
      if (!token.includes('.') && token.startsWith('app_')) {
        return token;
      }
    }

    return undefined;
  }
} 