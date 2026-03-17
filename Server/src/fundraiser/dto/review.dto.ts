import { IsInt, Max, MaxLength, Min, IsString, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000, { message: 'Review message must not exceed 1000 characters' })
    message: string;
}