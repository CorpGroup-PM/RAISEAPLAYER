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
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
