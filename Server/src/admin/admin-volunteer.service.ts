import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AdminVolunteerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ── List all volunteers ──────────────────────────────────────────────────
  async listVolunteers() {
    const volunteers = await this.prisma.volunteer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        city:      true,
        message:   true,
        status:    true,
        createdAt: true,
        user: {
          select: {
            id:          true,
            firstName:   true,
            lastName:    true,
            email:       true,
            phoneNumber: true,
          },
        },
      },
    });

    return { success: true, count: volunteers.length, data: volunteers };
  }

  // ── Accept a volunteer ───────────────────────────────────────────────────
  async acceptVolunteer(id: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!volunteer) throw new NotFoundException('Volunteer application not found.');
    if (volunteer.status === 'ACCEPTED') {
      throw new BadRequestException('Volunteer is already accepted.');
    }

    await this.prisma.volunteer.update({
      where: { id },
      data:  { status: 'ACCEPTED' },
    });

    // Send acceptance email (non-blocking — don't fail the request if mail fails)
    this.mailService
      .sendVolunteerAcceptedMail(volunteer.user.email, {
        name: `${volunteer.user.firstName} ${volunteer.user.lastName}`,
        volunteerId: id,
      })
      .catch(() => {/* mail failure should not block the response */});

    return { message: 'Volunteer accepted successfully.' };
  }

  // ── Get activities for a specific volunteer ──────────────────────────────
  async getVolunteerActivities(volunteerId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where:  { id: volunteerId },
      select: { id: true },
    });
    if (!volunteer) throw new NotFoundException('Volunteer not found.');

    const activities = await this.prisma.volunteerActivity.findMany({
      where:   { volunteerId },
      orderBy: { date: 'desc' },
    });

    return { data: activities };
  }

  // ── Reject a volunteer ───────────────────────────────────────────────────
  async rejectVolunteer(id: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!volunteer) throw new NotFoundException('Volunteer application not found.');
    if (volunteer.status === 'REJECTED') {
      throw new BadRequestException('Volunteer is already rejected.');
    }

    await this.prisma.volunteer.update({
      where: { id },
      data:  { status: 'REJECTED' },
    });

    // Send rejection email (non-blocking)
    this.mailService
      .sendVolunteerRejectedMail(volunteer.user.email, {
        name: `${volunteer.user.firstName} ${volunteer.user.lastName}`,
      })
      .catch(() => {/* mail failure should not block the response */});

    return { message: 'Volunteer rejected.' };
  }
}
