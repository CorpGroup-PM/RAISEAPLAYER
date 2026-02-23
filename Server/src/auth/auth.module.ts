import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LoginThrottlerGuard } from '../common/guards/throttler/login-throttler.guard';
import { OtpThrottlerGuard } from '../common/guards/throttler/otp-throttler.guard';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
    LoginThrottlerGuard,
    OtpThrottlerGuard,
  ],
  controllers: [AuthController],

  exports: [
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule { }
