import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @MaxLength(80)
  displayName!: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(3500)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalAppUserId?: string;
}
