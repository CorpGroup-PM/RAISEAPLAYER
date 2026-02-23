import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT reset token sent to email',
  })
  @IsString()
  resetToken: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'The new password to set (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Password must contain at least one digit',
  })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/,
    { message: 'Password must contain at least one special character (!@#$%^&*)' })
  newPassword: string;
}
