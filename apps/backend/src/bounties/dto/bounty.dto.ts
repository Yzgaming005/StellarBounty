import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBountyDto {
  @ApiProperty({
    description: 'Title of the bounty',
    example: 'Build a Stellar payment integration',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the bounty requirements',
    example: 'Implement a Stellar payment gateway that supports XLM and USDC...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({
    description: 'Reward amount in XLM (1 XLM = 1 stroop = 0.0000001 XLM)',
    example: '100',
  })
  @IsString()
  @IsNotEmpty()
  reward!: string;

  @ApiPropertyOptional({
    description: 'Array of tags for categorization',
    example: ['Stellar', 'Payment', 'Integration'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Deadline for the bounty (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  deadline!: string;
}

export class UpdateBountyDto {
  @ApiPropertyOptional({ description: 'Updated title' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Updated reward in XLM' })
  @IsOptional()
  @IsString()
  reward?: string;

  @ApiPropertyOptional({ description: 'Updated tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Updated deadline (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({
    description: 'Bounty status',
    enum: ['open', 'closed', 'in_progress'],
  })
  @IsOptional()
  @IsEnum(['open', 'closed', 'in_progress'])
  status?: string;
}

export class BountyResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Bounty title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Bounty description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Reward in XLM' })
  @IsString()
  reward!: string;

  @ApiProperty({ description: 'Deadline date' })
  @IsString()
  deadline!: string;

  @ApiProperty({
    description: 'Current status',
    enum: ['open', 'closed', 'in_progress'],
  })
  @IsString()
  status!: string;

  @ApiProperty({ description: 'Owner wallet address' })
  @IsString()
  ownerAddress!: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsString()
  updatedAt!: string;
}
