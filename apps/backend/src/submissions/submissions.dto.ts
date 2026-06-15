import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'URL for the submitted work, such as a GitHub PR or deployed demo',
    example: 'https://github.com/user/project/pull/42',
  })
  @IsUrl()
  @IsNotEmpty()
  link!: string;

  @ApiPropertyOptional({
    description: 'Optional context for reviewers',
    example: 'Includes tests, screenshots, and a deployment link.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmissionResponseDto {
  @ApiProperty({ description: 'Submission UUID' })
  id!: string;

  @ApiProperty({ description: 'Bounty UUID this submission belongs to' })
  bountyId!: string;

  @ApiProperty({ description: 'Contributor Stellar wallet address' })
  contributorAddress!: string;

  @ApiProperty({ description: 'Submitted work URL' })
  link!: string;

  @ApiPropertyOptional({ description: 'Optional submission notes', nullable: true })
  notes?: string | null;

  @ApiProperty({ description: 'Submission review status', enum: ['pending', 'approved', 'rejected'] })
  status!: string;

  @ApiProperty({ description: 'Submission creation timestamp' })
  createdAt!: string;
}
