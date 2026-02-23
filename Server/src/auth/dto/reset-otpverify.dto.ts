import { IsEmail, IsString, Length } from "class-validator";

export class VerifyResetOtpDto {
  @IsEmail({},{message:"Please Enter Valid Email"})
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}