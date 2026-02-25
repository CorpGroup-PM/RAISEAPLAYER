import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyResetOtpDto } from './dto/reset-otpverify.dto';

import { AccessTokenGuard } from '../common/guards/accessToken.guard';
import { RefreshTokenGuard } from '../common/guards/refreshToken.guard';
import { LoginThrottlerGuard } from '../common/guards/throttler/login-throttler.guard';
import { OtpThrottlerGuard } from '../common/guards/throttler/otp-throttler.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ------------------------------------------------------------------
  // REGISTER
  // ------------------------------------------------------------------
  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account in the system.'
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  // ------------------------------------------------------------------
  // SEND OTP  -- rate limited: max 3 per minute per IP
  // ------------------------------------------------------------------
  @Post('send-otp')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Send OTP (email / phone)',
    description: 'Sending OTP To Email.'
  })
  @ApiBody({ type: SendOtpDto })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  // ------------------------------------------------------------------
  // VERIFY EMAIL OTP -- rate limited: max 5 per minute per IP
  // ------------------------------------------------------------------
  @Post('verify-email')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verify email using OTP',
    description: 'Validates OTP to confirm the user\'s email address.'
  })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // ------------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------------
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    example: {
      access_token: 'jwt-access-token',
      refresh_token: 'jwt-refresh-token',
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ------------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'LogoutSuccessfully',
  })
  logout(@Req() req: Request & { user?: any }) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User payload missing')
    };
    return this.authService.logout(userId);
  }

  // ------------------------------------------------------------------
  // REFRESH TOKEN
  // ------------------------------------------------------------------
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Issues a new access token using the refresh token.'
  })
  refreshTokens(@Req() req: Request & { user?: any }) {
    const userId = req.user?.sub;
    const refreshToken = req.user?.refreshToken;

    if (!userId || !refreshToken) {
      throw new UnauthorizedException('Refresh token payload missing');
    }
    return this.authService.refreshTokens(userId, refreshToken);
  }

  // ------------------------------------------------------------------
  // GOOGLE OAUTH (EXCLUDED FROM SWAGGER)
  // ------------------------------------------------------------------
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  googleAuth() { }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { tokens, user } =
      await this.authService.googleOAuthLogin(req.user);

    const baseUrl = process.env.FRONTEND_SOCIAL_SUCCESS_URL;
    if (!baseUrl) {
      return res.status(500).json({ message: 'FRONTEND_SOCIAL_SUCCESS_URL is not configured' });
    }

    // Use URL fragment (#) instead of query string (?).
    // Fragments are never sent to the server in HTTP requests, never appear in
    // server logs, and are not captured by referrer headers -- reducing the risk
    // of tokens leaking via browser history or proxy/CDN logs.
    const fragment =
      `access_token=${encodeURIComponent(tokens.access_token)}&` +
      `refresh_token=${encodeURIComponent(tokens.refresh_token)}&` +
      `email=${encodeURIComponent(user.email)}&` +
      `first_name=${encodeURIComponent(user.firstName || '')}&` +
      `last_name=${encodeURIComponent(user.lastName || '')}&` +
      `picture=${encodeURIComponent(user.profileImageUrl || '')}`;

    return res.redirect(`${baseUrl}#${fragment}`);
  }

  // ------------------------------------------------------------------
  // FORGOT PASSWORD
  // ------------------------------------------------------------------
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send password reset OTP',
    description: "Sends an OTP to the user's email for password reset.",
  })

  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ------------------------------------------------------------------
  // VERIFY RESET OTP
  // ------------------------------------------------------------------
  @Post('verify-reset-otp')
  @ApiOperation({
    summary: 'Verify password reset OTP',
    description: 'Validates the OTP sent for password reset.',
  })
  @ApiBody({ type: VerifyResetOtpDto })
  async verifyOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto);
  }

  // ------------------------------------------------------------------
  // RESET PASSWORD
  // ------------------------------------------------------------------
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets the user password after successful OTP verification.',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
