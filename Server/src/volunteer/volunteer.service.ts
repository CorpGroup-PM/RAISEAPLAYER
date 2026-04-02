import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/aws/aws.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { VerifyPortalDto } from './dto/verify-portal.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VolunteerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3: AwsS3Service,
  ) {}

  // ── Generate NRPF ID ─────────────────────────────────────────────────────
  private async generateVolunteerId(): Promise<string> {
    const now   = new Date();
    const year  = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    const prefix = `NRPF${year}${month}${day}`;

    // Find the highest sequence number ever used across ALL volunteers
    const all = await this.prisma.volunteer.findMany({ select: { id: true } });
    const maxSeq = all.length > 0
      ? Math.max(...all.map((v) => parseInt(v.id.slice(-4))))
      : 0;

    return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
  }

  // ── Apply as volunteer ───────────────────────────────────────────────────
  async apply(userId: string, dto: CreateVolunteerDto) {
    const existing = await this.prisma.volunteer.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('You have already submitted a volunteer application.');
    }

    const id        = await this.generateVolunteerId();
    const volunteer = await this.prisma.volunteer.create({
      data: { id, userId, city: dto.city, message: dto.message ?? null },
    });

    return {
      message:   'Volunteer application submitted successfully.',
      volunteer: {
        id:        volunteer.id,
        city:      volunteer.city,
        status:    volunteer.status,
        createdAt: volunteer.createdAt,
      },
    };
  }

  // ── Get my volunteer status ──────────────────────────────────────────────
  async getMyStatus(userId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where:  { userId },
      select: { id: true, city: true, message: true, status: true, createdAt: true },
    });
    return volunteer ?? null;
  }

  // ── Verify volunteer portal login ────────────────────────────────────────
  async verifyPortal(userId: string, dto: VerifyPortalDto) {
    // 1. Load user with volunteer + passwordHash + provider
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, passwordHash: true, provider: true, volunteer: { select: { id: true, status: true } } },
    });

    if (!user?.volunteer) {
      throw new UnauthorizedException('No volunteer application found.');
    }
    if (user.volunteer.status !== 'ACCEPTED') {
      throw new UnauthorizedException('Your volunteer application is not accepted.');
    }

    // 2. Verify volunteer ID matches this user
    if (user.volunteer.id !== dto.volunteerId) {
      throw new UnauthorizedException('Volunteer ID does not match.');
    }

    // 3. Password check — skip for Google OAuth users (Option A)
    if (user.provider !== 'GOOGLE') {
      if (!dto.password) {
        throw new UnauthorizedException('Password is required.');
      }
      if (!user.passwordHash) {
        throw new UnauthorizedException('No password set for this account.');
      }
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Incorrect password.');
      }
    }

    return { success: true, message: 'Portal access granted.' };
  }

  // ── Add a volunteer activity ─────────────────────────────────────────────
  async addActivity(
    userId: string,
    file: Express.Multer.File,
    dto: CreateActivityDto,
  ) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where:  { userId },
      select: { id: true, status: true },
    });

    if (!volunteer || volunteer.status !== 'ACCEPTED') {
      throw new BadRequestException('Only accepted volunteers can log activities.');
    }

    // Validate date
    const parsedDate = new Date(dto.date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date format.');
    }

    const imageUrl = await this.awsS3.uploadProfileImage(file, 'volunteers/activities');

    const activity = await this.prisma.volunteerActivity.create({
      data: {
        volunteerId:    volunteer.id,
        imageUrl,
        date:           parsedDate,
        note:           dto.note,
        helpedCampaign: dto.helpedCampaign,
      },
    });

    return { message: 'Activity logged successfully.', activity };
  }

  // ── Get my activities ────────────────────────────────────────────────────
  async getMyActivities(userId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where:  { userId },
      select: { id: true },
    });

    if (!volunteer) return { data: [] };

    const activities = await this.prisma.volunteerActivity.findMany({
      where:   { volunteerId: volunteer.id },
      orderBy: { date: 'desc' },
    });

    return { data: activities };
  }

  // ── Public: activities for one volunteer ────────────────────────────────
  async getPublicActivities(volunteerId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where:  { id: volunteerId },
      select: {
        id:     true,
        city:   true,
        status: true,
        user: { select: { firstName: true, lastName: true, profileImageUrl: true } },
      },
    });

    if (!volunteer || volunteer.status !== 'ACCEPTED') {
      return { volunteer: null, data: [] };
    }

    const activities = await this.prisma.volunteerActivity.findMany({
      where:   { volunteerId },
      orderBy: { date: 'desc' },
    });

    return { volunteer, data: activities };
  }

  // ── Delete a volunteer activity ──────────────────────────────────────────
  async deleteActivity(userId: string, activityId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where:  { userId },
      select: { id: true },
    });

    if (!volunteer) throw new NotFoundException('Volunteer not found.');

    const activity = await this.prisma.volunteerActivity.findUnique({
      where:  { id: activityId },
      select: { id: true, volunteerId: true },
    });

    if (!activity) throw new NotFoundException('Activity not found.');
    if (activity.volunteerId !== volunteer.id) {
      throw new UnauthorizedException('You can only delete your own activities.');
    }

    await this.prisma.volunteerActivity.delete({ where: { id: activityId } });
    return { message: 'Activity deleted successfully.' };
  }

  // ── Public: all activities across all accepted volunteers (paginated) ────
  async getAllPublicActivities(page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.volunteerActivity.findMany({
        where: { volunteer: { status: 'ACCEPTED' } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id:             true,
          imageUrl:       true,
          date:           true,
          note:           true,
          helpedCampaign: true,
          volunteer: {
            select: {
              id:   true,
              city: true,
              user: { select: { firstName: true, lastName: true, profileImageUrl: true } },
            },
          },
        },
      }),
      this.prisma.volunteerActivity.count({
        where: { volunteer: { status: 'ACCEPTED' } },
      }),
    ]);

    return { data: activities, total, page, limit };
  }

  // ── Public: all accepted volunteers (paginated) ──────────────────────────
  async getPublicVolunteers(page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [volunteers, total] = await Promise.all([
      this.prisma.volunteer.findMany({
        where:   { status: 'ACCEPTED' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        select: {
          id:        true,
          city:      true,
          createdAt: true,
          user: {
            select: {
              firstName:       true,
              lastName:        true,
              profileImageUrl: true,
            },
          },
        },
      }),
      this.prisma.volunteer.count({ where: { status: 'ACCEPTED' } }),
    ]);

    return {
      data:       volunteers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
