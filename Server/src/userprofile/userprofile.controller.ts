import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserprofileService } from './userprofile.service';
import { UpdateProfileDto } from 'src/userprofile/dto/updateprofile.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { createFileInterceptorOptions } from 'src/common/upload/file-upload.helper';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('user')
export class UserprofileController {
  constructor(private readonly userProfileService: UserprofileService) {}

  // @UseGuards(AccessTokenGuard)
  // @Post('pan-profile')
  // async createPan(@Req() req, @Body() dto: PanDetailsDto) {
  //     const userId = req.user.sub;
  //     const role = req.user.role;

  //     return this.userProfileService.createPan(userId, dto);
  // }

  // ------------------------------------------------------------------
  // GET USER PROFILE
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Fetch logged-in user profile including PAN details (if available)',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile fetched successfully',
    example: {
      id: 'user-id',
      email: 'user@example.com',
      firstName: 'Rahul',
      lastName: 'Sharma',
      profileImageUrl: 'https://cdn.example.com/profile.png',
      panDetails: {
        panNumber: 'ABCDE1234F',
        panName: 'RAHUL SHARMA',
        status: 'VERIFIED',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserProfile(@Req() req: any) {
    const userId = req.user.sub;
    return this.userProfileService.getUserProfilewithPan(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Get('kyc-status')
  @ApiOperation({
    summary: 'Get KYC (PAN) completion status',
    description:
      'Returns whether the authenticated user has completed PAN KYC. Never exposes the full PAN number.',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC status returned successfully',
    example: {
      panCompleted: true,
      panNumberMasked: 'XXXXX234F',
      kycStatus: 'COMPLETE',
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKycStatus(@Req() req: any) {
    return this.userProfileService.getKycStatus(req.user.sub);
  }

  // ------------------------------------------------------------------
  // UPDATE USER PROFILE
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @Put('profile')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update basic user profile details',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateUserProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.sub;
    return this.userProfileService.updateProfile(userId, dto);
  }

  // ------------------------------------------------------------------
  // UPDATE PROFILE PICTURE
  // ------------------------------------------------------------------
  @UseGuards(IpThrottlerGuard, AccessTokenGuard)
  @Throttle({ upload: { limit: 20, ttl: 3600000 } })
  @Put('profile-picture')
  @ApiOperation({
    summary: 'Update profile picture',
    description: 'Upload or replace user profile picture (JPEG / PNG, max 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createFileInterceptorOptions({
        allowedMimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        maxFileSizeMB: 5,
      }),
    ),
  )
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
    example: {
      profileImageUrl: 'https://cdn.example.com/users/profile.png',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or file too large',
  })
  async updateProfilePicture(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.sub;
    return this.userProfileService.updateProfilePicture(userId, file);
  }
}
