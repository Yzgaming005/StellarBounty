import { IsString, IsUrl, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSubmissionDto {
  @IsUrl()
  @IsNotEmpty()
  link!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
