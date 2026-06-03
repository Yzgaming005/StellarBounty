import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSubmissionDto {
  @IsUrl()
  @IsNotEmpty()
  link!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
