import { IsEmail, } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The registered email address',
  })
  @IsEmail()
  email: string;
}
