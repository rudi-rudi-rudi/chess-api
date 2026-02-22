import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  priceId?: string;
}
