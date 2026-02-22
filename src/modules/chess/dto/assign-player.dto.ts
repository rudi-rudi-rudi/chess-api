import { IsIn, IsString, MinLength } from 'class-validator';

export class AssignPlayerDto {
  @IsString()
  @MinLength(3)
  playerId!: string;

  @IsIn(['w', 'b'])
  color!: 'w' | 'b';
}
