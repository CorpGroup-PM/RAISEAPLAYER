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
  NotFoundException,
} from '@nestjs/common';
import type { CookieOptions } from 'express';
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
import { OAuthCodeStore } from './oauth-code.store';
import { ExchangeOAuthCodeDto } from './dto/exchange-oauth-code.dto';
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
import { SignupThrottlerGuard } from '../common/guards/throttler/signup-throttler.guard';

/** Build cookie options for the HttpOnly refresh_token cookie. */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    // Restrict to the refresh endpoint so the browser only sends this cookie
    // when renewing tokens — never to other API endpoints.
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT_REFRESH_EXPIRATION
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthCodeStore: OAuthCodeStore,
  ) { }

  // ------------------------------------------------------------------
  // REGISTER — rate limited: max 5 accounts per 10 min per IP
  // ------------------------------------------------------------------
  @Post('register')
  @UseGuards(SignupThrottlerGuard)
  @Throttle({ short: { limit: 5, ttl: 600000 } })
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
  // SEND OTP  -- rate limited: max 8 per minute per IP
  // ------------------------------------------------------------------
  @Post('send-otp')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
  @ApiOperation({
    summary: 'Send OTP (email / phone)',
    description: 'Sending OTP To Email.'
  })
  @ApiBody({ type: SendOtpDto })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  // ------------------------------------------------------------------
  // VERIFY EMAIL OTP -- rate limited: max 8 per minute per IP
  // ------------------------------------------------------------------
  @Post('verify-email')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
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
  @Throttle({ short: { limit: 8, ttl: 60000 } })
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
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    // Set refresh token as HttpOnly cookie — never exposed to JavaScript
    res.cookie('refresh_token', result.tokens.refresh_token, refreshCookieOptions());
    // Return access token + user profile; refresh token is in the cookie
    return { access_token: result.tokens.access_token, user: result.user };
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
  logout(@Req() req: Request & { user?: any }, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User payload missing');
    // Clear the HttpOnly refresh token cookie on logout
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
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
  async refreshTokens(
    @Req() req: Request & { user?: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.sub;
    const refreshToken = req.user?.refreshToken;

    if (!userId || !refreshToken) {
      throw new UnauthorizedException('Refresh token payload missing');
    }

    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    // Rotate the HttpOnly refresh token cookie
    res.cookie('refresh_token', tokens.refresh_token, refreshCookieOptions());
    return { access_token: tokens.access_token };
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
  async googleAuthRedirect(@Req() req: Request & { user?: any }, @Res() res: Response) {
    const { tokens, user } =
      await this.authService.googleOAuthLogin(req.user);

    const baseUrl = process.env.FRONTEND_SOCIAL_SUCCESS_URL;
    if (!baseUrl) {
      return res.status(500).json({ message: 'FRONTEND_SOCIAL_SUCCESS_URL is not configured' });
    }

    // Store tokens server-side under a short-lived one-time code.
    // The redirect URL carries only the opaque code — never the tokens themselves.
    // The frontend exchanges the code for tokens via POST /auth/social/exchange.
    const code = this.oauthCodeStore.generate(tokens, {
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileImageUrl: user.profileImageUrl || '',
      role: user.role || 'USER',
    });

    return res.redirect(`${baseUrl}?code=${code}`);
  }

  // ------------------------------------------------------------------
  // OAUTH CODE EXCHANGE — frontend calls this with the one-time code
  // ------------------------------------------------------------------
  @Post('social/exchange')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiExcludeEndpoint()
  exchangeOAuthCode(
    @Body() dto: ExchangeOAuthCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const entry = this.oauthCodeStore.consume(dto.code);
    if (!entry) {
      throw new NotFoundException('OAuth code is invalid or has expired');
    }
    // Set the refresh token as HttpOnly cookie — same as regular login
    res.cookie('refresh_token', entry.tokens.refresh_token, refreshCookieOptions());
    return { tokens: { access_token: entry.tokens.access_token }, user: entry.user };
  }

  // ------------------------------------------------------------------
  // FORGOT PASSWORD
  // ------------------------------------------------------------------
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
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
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
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
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
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
