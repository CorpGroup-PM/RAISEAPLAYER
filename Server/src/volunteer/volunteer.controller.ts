
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VolunteerService } from './volunteer.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { VerifyPortalDto } from './dto/verify-portal.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@ApiTags('Volunteer')
@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  // ── Public: all accepted volunteers (paginated) ─────────────────────────
  @Get('public')
  @ApiOperation({ summary: 'List all accepted volunteers (public, paginated)' })
  getPublicVolunteers(
    @Query('page')  page  = '1',
    @Query('limit') limit = '12',
  ) {
    return this.volunteerService.getPublicVolunteers(+page, +limit);
  }

  // ── Public: all activities across all accepted volunteers ───────────────
  @Get('public/activities')
  @ApiOperation({ summary: 'Get all activities from all accepted volunteers (paginated)' })
  getAllPublicActivities(
    @Query('page')  page  = '1',
    @Query('limit') limit = '12',
  ) {
    return this.volunteerService.getAllPublicActivities(+page, +limit);
  }

  // ── Public: activities for one volunteer ────────────────────────────────
  @Get('public/:id/activities')
  @ApiOperation({ summary: 'Get public activities for a volunteer' })
  getPublicActivities(@Param('id') id: string) {
    return this.volunteerService.getPublicActivities(id);
  }

  // ── Authenticated routes ─────────────────────────────────────────────────
  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a volunteer application' })
  apply(@Req() req: any, @Body() dto: CreateVolunteerDto) {
    return this.volunteerService.apply(req.user.sub, dto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my volunteer application status' })
  getMyStatus(@Req() req: any) {
    return this.volunteerService.getMyStatus(req.user.sub);
  }

  @Post('portal-verify')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify volunteer portal login' })
  verifyPortal(@Req() req: any, @Body() dto: VerifyPortalDto) {
    return this.volunteerService.verifyPortal(req.user.sub, dto);
  }

  @Post('activities')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log a new volunteer activity' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Only image files are allowed.'), false);
      }
      cb(null, true);
    },
  }))
  addActivity(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateActivityDto,
  ) {
    return this.volunteerService.addActivity(req.user.sub, file, dto);
  }

  @Get('activities')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my volunteer activities' })
  getMyActivities(@Req() req: any) {
    return this.volunteerService.getMyActivities(req.user.sub);
  }

  @Delete('activities/:id')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a volunteer activity' })
  deleteActivity(@Req() req: any, @Param('id') id: string) {
    return this.volunteerService.deleteActivity(req.user.sub, id);
  }
}
