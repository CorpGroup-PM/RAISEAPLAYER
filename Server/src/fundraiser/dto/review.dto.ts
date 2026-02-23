import { IsInt, Max, Min, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    name: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    message: string;

    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;
}