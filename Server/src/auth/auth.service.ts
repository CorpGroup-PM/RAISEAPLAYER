import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AppConstants } from 'src/common/constants/time.constants';
import { CryptoHelper } from 'src/common/helpers/crypto.helper';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpType, UserRole, AuthProvider } from '@prisma/client';
import { SendOtpDto } from './dto/send-otp.dto';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailService: MailService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ---------------------------------------------------------
  // SIGNUP
  // ---------------------------------------------------------
  async signup(signupDto: SignupDto) {
    const normalizedEmail = signupDto.email.toLowerCase();
    const { phoneNumber, firstName, lastName, password } = signupDto;

    // 1. Check email already exists
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser)
      throw new ConflictException('Email Already Been Registered.');

    //  2. Check if email has verified OTP
    const verifiedOtp = await this.prisma.emailOtp.findFirst({
      where: { email: normalizedEmail, isUsed: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verifiedOtp) {
      throw new BadRequestException(
        'Email not verified. Please verify your email before signup.',
      );
    }

    // Reject stale verifications — OTP must have been verified within a grace window
    const OTP_SIGNUP_GRACE_MS = 15 * 60 * 1000; // 15 min after OTP expiry
    if (Date.now() > verifiedOtp.expiresAt.getTime() + OTP_SIGNUP_GRACE_MS) {
      await this.prisma.emailOtp.deleteMany({ where: { email: normalizedEmail } });
      throw new BadRequestException(
        'Email verification has expired. Please verify your email again.',
      );
    }

    // Normalize phone
    const normalizedPhone = phoneNumber.replace(/^(\+91)/, '');

    // 3. Check phone exists
    const existingPhone = await this.usersService.findByPhone(normalizedPhone);
    if (existingPhone)
      throw new ConflictException('Phone number already in use.');

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user (email already verified from OTP table)
    const newUser = await this.usersService.create({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      firstName,
      lastName,
      passwordHash: hashedPassword,
      provider: AuthProvider.LOCAL,
      isEmailVerified: true, // You can set this because OTP is verified
    });

    await this.mailService.sendWelcomeMail(newUser.email, {
      name: newUser.firstName ?? 'Player',
    });

    await this.prisma.emailOtp.deleteMany({
      where: { email: normalizedEmail },
    });
    return {
      message: 'Account created successfully.',
      userId: newUser.id,
      data: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        createdAt: newUser.createdAt,
      },
    };
  }

  // ---------------------------------------------------------
  //  SEND OTP
  // ---------------------------------------------------------
  async sendOtp({ email }: SendOtpDto) {
    const now = Date.now();
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) throw new ConflictException('Email is already used.');

    //check cooldown and latest otp and last otp
    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const now = Date.now();
      const diff = now - lastOtp.createdAt.getTime(); // millseconds

      if (diff < AppConstants.OTP_COOLDOWN_SECONDS * 1000) {
        const left = Math.ceil(
          (AppConstants.OTP_COOLDOWN_SECONDS * 1000 - diff) / 1000,
        );
        throw new BadRequestException({
          message: `Please wait ${left} seconds before requesting a new OTP.`,
        });
      }
    }

    //Delete Previous OTP
    await this.prisma.emailOtp.deleteMany({
      where: { email: normalizedEmail },
    });

    //Generate OTP
    const otp = CryptoHelper.generateOtp();
    const otpHash = await CryptoHelper.hashOtp(otp);

    const expiresAt = new Date(
      now + AppConstants.OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    await this.prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otpCode: otp,
        otpHash,
        expiresAt,
        attemptCount: 0,
        type: OtpType.EMAIL_VERIFY,
      },
    });

    //send otp
    await this.mailService.sendUserConfirmation(normalizedEmail, otp);

    return { message: 'Verification code sent. Please check your email.' };
  }

  // ---------------------------------------------------------
  // VERIFY EMAIL OTP
  // ---------------------------------------------------------
  async verifyEmail({ email, otp }: VerifyEmailDto) {
    const now = Date.now();
    const normalizedEmail = email.toLowerCase();

    const record = await this.prisma.emailOtp.findFirst({
      where: { email: normalizedEmail, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new NotFoundException({
        message: 'OTP not found. Please request a new one.',
      });
    }

    // Check expiry
    if (record.expiresAt.getTime() < now) {
      throw new BadRequestException({
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Check max attempts
    if (record.attemptCount >= AppConstants.OTP_MAX_ATTEMPTS) {
      throw new BadRequestException({
        message: 'Maximum attempts reached. Please request a new OTP.',
      });
    }

    // Compare OTP
    const isCorrect = await CryptoHelper.compareOtp(otp, record.otpHash);

    if (!isCorrect) {
      await this.prisma.emailOtp.update({
        where: { id: record.id },
        data: { attemptCount: { increment: 1 } },
      });

      throw new BadRequestException({ message: 'Invalid OTP.' });
    }

    // OTP is correct → mark isUsed = true
    await this.prisma.emailOtp.update({
      where: { id: record.id },
      data: { isUsed: true },
    });

    return { message: 'Verification successful.' };
  }

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();
    const { password } = loginDto;

    // const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified)
      throw new ForbiddenException('Please verify your email first');

    if (!user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      message: 'Login successful.',
      tokens,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }

  // ---------------------------------------------------------
  // GENERATE TOKENS
  // ---------------------------------------------------------
  async getTokens(userId: string, email: string, role: UserRole) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // ---------------------------------------------------------
  // REFRESH TOKENS
  // ---------------------------------------------------------
  async refreshTokens(userId: string, rt: string) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.currentHashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    // Enforce refresh token lifetime (7 days)
    if (
      !user.refreshTokenUpdatedAt ||
      Date.now() - user.refreshTokenUpdatedAt.getTime() >
      7 * 24 * 60 * 60 * 1000
    ) {
      throw new ForbiddenException('Refresh token expired');
    }

    // Compare plain refresh token with stored hash
    const isValid = await bcrypt.compare(
      rt,
      user.currentHashedRefreshToken,
    );

    if (!isValid) {
      throw new ForbiddenException('Access Denied');
    }

    // 🔄 Rotate tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }


  // ---------------------------------------------------------
  // UPDATE REFRESH TOKEN
  // ---------------------------------------------------------
  async updateRefreshToken(userId: string, refreshToken: string) {
    const bcryptHash = await bcrypt.hash(refreshToken, 10);

    await this.usersService.update(userId, {
      currentHashedRefreshToken: bcryptHash,
      refreshTokenUpdatedAt: new Date(),
    });
  }



  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------
  async logout(userId: string) {
    await this.usersService.update(userId, {
      currentHashedRefreshToken: null,
      refreshTokenUpdatedAt: null,
    });
    return { success: true, message: 'Logged out successfully' };
  }

  // ---------------------------------------------------------
  // FORGOT PASSWORD (SEND OTP)
  // ---------------------------------------------------------
  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If an account exists with this email, you will receive a code.',
      };
    }

    //cool down timing send new otp
    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const now = Date.now();
      const diff = now - lastOtp.createdAt.getTime(); // milliseconds

      if (diff < AppConstants.OTP_COOLDOWN_SECONDS * 1000) {
        const left = Math.ceil(
          (AppConstants.OTP_COOLDOWN_SECONDS * 1000 - diff) / 1000,
        );
        throw new BadRequestException({
          message: `Please wait ${left} seconds before requesting a new OTP.`,
        });
      }
    }
    await this.prisma.emailOtp.deleteMany({
      where: { email, type: OtpType.PASSWORD_RESET },
    });

    //otp generation
    const otpCode = CryptoHelper.generateOtp();
    const otpHash = await CryptoHelper.hashOtp(otpCode);

    const expiresAt = new Date(
      Date.now() + AppConstants.OTP_REST_EXPIR_MINUTES * 60 * 1000,
    );

    await this.prisma.emailOtp.create({
      data: {
        email: user.email,
        otpCode,
        otpHash,
        type: OtpType.PASSWORD_RESET,
        expiresAt,
        userId: user.id,
      },
    });

    await this.mailService.sendPasswordReset(user.email, otpCode);

    return {
      message: 'If an account exists for this email, we’ll send a verification code.',
    };
  }

  // ---------------------------------------------------------
  // RESET PASSWORD
  // ---------------------------------------------------------
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const { resetToken, newPassword } = dto;
    // 1First check DB → is token stored?
    const tokenRecord = await this.prisma.resetToken.findFirst({
      where: { token: resetToken, email },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Reset token is invalid or already used.');
    }

    // 2Check if token expired (DB expiry)
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.resetToken.deleteMany({ where: { token: resetToken } });
      throw new BadRequestException('Session Expired.');
    }

    // 3️ Verify JWT
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(resetToken, {
        secret: process.env.JWT_RESET_SECRET,
      });
    } catch (err) {
      // Also delete from DB if JWT invalid
      await this.prisma.resetToken.deleteMany({ where: { token: resetToken } });
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // 4️ Ensure email in token matches DTO
    if (payload.email !== email) {
      throw new UnauthorizedException('Token does not belong to this email.');
    }

    // 5️ Hash & update password
    const hashedPassword = await CryptoHelper.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    // 6️ Delete token → ONE-TIME USE
    await this.prisma.resetToken.deleteMany({
      where: { token: resetToken },
    });

    return {
      message: 'Password reset successfully. You can now log in.',
    };
  }

  //xxxxxxxxxxxxxx
  //googleAuth
  //xxxxxxxxxxxxxx
  async googleOAuthLogin(profile: any) {
    const { email, firstName, lastName, googleId, profileImageUrl } = profile;

    // 1. Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. If not, create user
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          googleId,
          provider: 'GOOGLE',
          isEmailVerified: true,
          profileImageUrl,
        },
      });
    }

    // 3. Generate tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // 4. Save refresh token
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // Return both tokens and user data
    return { tokens, user };
  }

  //xxxxxxxxxxxxxxxxxxxx
  // Verify OTp
  //xxxxxxxxxxxxxxxxxxxxx

  async verifyPasswordResetOtp(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim(); // normalize
    const { otp } = dto;

    const record = await this.prisma.emailOtp.findFirst({
      where: { email, type: OtpType.PASSWORD_RESET },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const isValid = await CryptoHelper.compareOtp(otp, record.otpHash);

    if (!isValid) {
      await this.prisma.emailOtp.update({
        where: { id: record.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP.');
    }

    // OTP verified → delete OTP to avoid reuse
    await this.prisma.emailOtp.delete({
      where: { id: record.id },
    });

    const resetToken = await this.jwtService.signAsync(
      { email },
      { secret: process.env.JWT_RESET_SECRET, expiresIn: '10m' },
    );

    // ✅ FIX: overwrite existing reset token instead of create()
    await this.prisma.resetToken.upsert({
      where: { email },
      update: {
        token: resetToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      create: {
        email,
        token: resetToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return {
      message: 'OTP verified successfully.',
      resetToken,
    };
  }

}