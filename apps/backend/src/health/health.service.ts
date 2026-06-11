import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      version: '0.1.0',
      uptime: process.uptime(),
    };
  }
}
