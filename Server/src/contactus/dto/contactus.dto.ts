import { ApiProperty } from '@nestjs/swagger';
import {
    IsDefined,
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MinLength,
    MaxLength,
} from 'class-validator';

export class ContactUsDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the user',
    })
    @IsDefined({ message: 'Name is required.' })
    @IsNotEmpty({ message: 'Name should not be empty.' })
    @IsString({ message: 'Name must be a string.' })
    @MinLength(2, { message: 'Name must be at least 2 characters long.' })
    @MaxLength(50, { message: 'Name must not exceed 50 characters.' })
    @Matches(/^[A-Za-z ]+$/, {
        message: 'Name can contain only letters and spaces.',
    })
    name: string;

    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'Email address of the user',
    })
    @IsDefined({ message: 'Email is required.' })
    @IsNotEmpty({ message: 'Email should not be empty.' })
    @IsEmail({}, { message: 'Invalid email address.' })
    email: string;

    @ApiProperty({
        example: '9876543210',
        description: 'Phone number of the user',
    })
    @IsDefined({ message: 'Phone number is required.' })
    @IsNotEmpty({ message: 'Phone number should not be empty.' })
    @Matches(/^[6-9]\d{9}$/, {
        message: 'Phone number must be a valid 10-digit Indian mobile number.',
    })
    phoneNumber: string;

    @ApiProperty({
        example: 'I would like to know more about starting a fundraiser.',
        description: 'Message sent by the user',
    })
    @IsDefined({ message: 'Message is required.' })
    @IsNotEmpty({ message: 'Message should not be empty.' })
    @IsString({ message: 'Message must be a string.' })
    @MinLength(10, {
        message: 'Message must be at least 10 characters long.',
    })
    @MaxLength(500, {
        message: 'Message must not exceed 500 characters.',
    })
    message: string;
}
