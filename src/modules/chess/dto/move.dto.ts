import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class MoveDto {
  @IsOptional()
  @IsString()
  san?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  from?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  to?: string;

  @IsOptional()
  @IsIn(['q', 'r', 'b', 'n'])
  promotion?: 'q' | 'r' | 'b' | 'n';
}
