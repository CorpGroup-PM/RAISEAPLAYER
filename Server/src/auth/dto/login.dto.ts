import { IsEmail, IsString, } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address of the user',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'User password for authentication',
  })
  @IsString()
  password: string;
}
