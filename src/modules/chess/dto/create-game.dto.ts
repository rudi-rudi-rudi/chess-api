import { Type } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class TimeControlDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  initialSeconds!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  incrementSeconds?: number;
}

export class CreateGameDto {
  @IsOptional()
  @IsIn(['pvp', 'pve'])
  mode?: 'pvp' | 'pve';

  @IsOptional()
  @IsString()
  fen?: string;

  @IsOptional()
  @IsIn(['w', 'b'])
  aiColor?: 'w' | 'b';

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TimeControlDto)
  timeControl?: TimeControlDto;
}
