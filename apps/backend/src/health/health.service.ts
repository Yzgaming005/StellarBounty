import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthResponseDto } from './dto/health.dto';

const DATABASE_HEALTH_TIMEOUT_MS = 250;

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async getHealth(): Promise<HealthResponseDto> {
    const database = await this.getDatabaseStatus();

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      version: '0.1.0',
      uptime: process.uptime(),
      database,
    };
  }

  private async getDatabaseStatus(): Promise<'connected' | 'disconnected'> {
    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database health check timed out')), DATABASE_HEALTH_TIMEOUT_MS),
        ),
      ]);
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
