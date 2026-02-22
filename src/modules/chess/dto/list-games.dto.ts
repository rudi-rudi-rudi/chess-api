import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListGamesDto {
  @IsOptional()
  @IsIn(['pvp', 'pve'])
  mode?: 'pvp' | 'pve';

  @IsOptional()
  @IsIn(['active', 'finished'])
  status?: 'active' | 'finished';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
