import { IsIn } from 'class-validator';

export class ResignDto {
  @IsIn(['w', 'b'])
  color!: 'w' | 'b';
}
