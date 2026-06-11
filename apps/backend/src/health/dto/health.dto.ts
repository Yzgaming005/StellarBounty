import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, Min } from 'class-validator';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Service status',
    example: 'ok',
    enum: ['ok', 'degraded', 'down'],
  })
  @IsEnum(['ok', 'degraded', 'down'])
  status!: string;

  @ApiProperty({
    description: 'Current server timestamp',
    example: '2025-05-19T12:00:00.000Z',
  })
  @IsString()
  timestamp!: string;

  @ApiProperty({
    description: 'Environment',
    example: 'development',
    enum: ['development', 'staging', 'production'],
  })
  @IsEnum(['development', 'staging', 'production'])
  environment!: string;

  @ApiProperty({
    description: 'Application version',
    example: '1.0.0',
  })
  @IsString()
  version!: string;

  @ApiProperty({
    description: 'Uptime in seconds',
    example: 3600,
  })
  @IsNumber()
  @Min(0)
  uptime!: number;
}
