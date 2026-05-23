import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @IsUrl()
  link!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
