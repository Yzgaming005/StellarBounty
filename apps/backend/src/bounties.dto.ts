import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BountyStatus } from './entities/bounty.entity';

export class CreateBountyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  rewardAmount!: string;

  @IsString()
  @IsNotEmpty()
  ownerAddress!: string;

  @IsOptional()
  @IsISO8601()
  deadline?: string;
}

export class UpdateBountyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rewardAmount?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerAddress?: string;

  @IsOptional()
  @IsISO8601()
  deadline?: string;

  @IsOptional()
  @IsEnum(BountyStatus)
  status?: BountyStatus;
}
