import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'ID of the bounty being submitted to',
    example: 'clx4f8a2s0000aabb12345678',
  })
  @IsString()
  @IsNotEmpty()
  bountyId: string;

  @ApiProperty({
    description: 'Link to the submitted work (GitHub PR, demo URL, etc.)',
    example: 'https://github.com/user/repo/pull/42',
  })
  @IsUrl()
  @IsNotEmpty()
  workLink: string;

  @ApiPropertyOptional({
    description: 'Additional notes or description of the submission',
    example: 'Implemented the Stellar payment integration with full test coverage.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  notes?: string;
}

export class UpdateSubmissionStatusDto {
  @ApiProperty({
    description: 'New status for the submission',
    enum: ['pending', 'approved', 'rejected'],
    example: 'approved',
  })
  @IsEnum(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}

export class SubmissionResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Bounty ID this submission belongs to' })
  @IsString()
  bountyId: string;

  @ApiProperty({ description: 'Submitter wallet address' })
  @IsString()
  submitterAddress: string;

  @ApiProperty({ description: 'Link to submitted work' })
  @IsString()
  workLink: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Submission status',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsString()
  updatedAt: string;
}
