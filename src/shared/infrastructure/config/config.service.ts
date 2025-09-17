import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get mongodbWriteUri(): string {
    return process.env.MONGODB_WRITE_URI || 'mongodb://localhost:27017/family-task-manager-write';
  }

  get mongodbReadUri(): string {
    return process.env.MONGODB_READ_URI || 'mongodb://localhost:27017/family-task-manager-read';
  }

  get mongodbEventsUri(): string {
    return process.env.MONGODB_EVENTS_URI || 'mongodb://localhost:27017/family-task-manager-events';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'your-secret-key';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '24h';
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
