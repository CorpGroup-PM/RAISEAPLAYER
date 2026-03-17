import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUpdateDto {
  @ApiProperty({
    example: 'Selected for district team',
    maxLength: 150,
    description: 'Title of the fundraiser update',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    example: 'I have been selected for the district team...',
    description: 'Detailed progress update',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Update content must not exceed 5000 characters' })
  content: string;
}
