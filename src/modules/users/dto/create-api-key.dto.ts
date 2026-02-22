import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
