import {IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address used for signup',
  })
  @IsEmail({}, { message: ' email Invalid format.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP sent to the user email',
  })
  @IsString()
  @Length(6, 6,{message:'Invalid Otp'})
  otp: string;
}
