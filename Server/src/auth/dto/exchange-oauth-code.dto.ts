import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ExchangeOAuthCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64) // exactly 64 hex chars (32 random bytes)
  code: string;
}
