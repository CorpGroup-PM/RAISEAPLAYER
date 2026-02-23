import { ArrayNotEmpty, IsArray, IsUrl } from 'class-validator';

export class AddYoutubeMediaDto {
  @ArrayNotEmpty({ message: 'Invalid YouTube video URL(s)' })
  @IsUrl(
    { require_protocol: true },
    { each: true, message: 'Invalid YouTube video URL(s)' },
  )
  @IsArray({ message: 'Invalid YouTube video URL(s)' })
  youtubeUrl: string[];
}
