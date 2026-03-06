import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFundraiserDto } from './dto/fundraiser.dto';
import { CampaignFor, CampaignStatus, Prisma } from '@prisma/client';
import { AwsS3Service } from 'src/aws/aws.service';
import { PaginationDto } from './dto/pagination.dto';
import { CreateUpdateDto } from './dto/create-update.dto';
import { MailService } from 'src/mail/mail.service';
import { CreateReviewDto, } from './dto/review.dto';

@Injectable()
export class FundraiserService {
  constructor(private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
    private readonly mailService: MailService,
  ) { }

  async createFundraiser(
    dto: CreateFundraiserDto,
    creatorId: string,
  ) {
    if (!creatorId) {
      throw new BadRequestException('Invalid user context');
    }

    // -------------------------
    // FETCH USER (FOR EMAIL)
    // -------------------------
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        email: true,
        firstName: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // -------------------------
    // PAN VALIDATION
    // -------------------------
    const panDetails = await this.prisma.panDetails.findUnique({
      where: { userId: creatorId },
    });

    if (!panDetails) {
      throw new BadRequestException(
        'PAN details are required before creating a fundraiser',
      );
    }

    // -------------------------
    // VALIDATION
    // -------------------------
    if (
      dto.campaignFor === CampaignFor.OTHER &&
      !dto.beneficiaryOther
    ) {
      throw new BadRequestException(
        'Beneficiary details are required for OTHER campaign',
      );
    }

    // -------------------------
    // BASE DATA
    // -------------------------
    const data: any = {
      status: CampaignStatus.PENDING_REVIEW,
      creatorId,
      campaignFor: dto.campaignFor,

      title: dto.title,
      shortDescription: dto.shortDescription,
      story: dto.story,

      sport: dto.sport,
      discipline: dto.discipline,
      level: dto.level,
      skills: dto.skills,

      city: dto.city,
      state: dto.state,
      country: dto.country ?? 'India',

      coverImageURL: '',
      goalAmount: dto.goalAmount,
    };

    // -------------------------
    // BENEFICIARY
    // -------------------------
    if (dto.campaignFor === CampaignFor.SELF) {
      data.beneficiaryUserId = creatorId;
    }

    if (dto.campaignFor === CampaignFor.OTHER) {
      data.beneficiaryOther = {
        create: {
          fullName: dto.beneficiaryOther!.name,
          relationshipToCreator: dto.beneficiaryOther!.relation,
          age: dto.beneficiaryOther!.age,
          phoneNumber: dto.beneficiaryOther!.phoneNumber,
          email: dto.beneficiaryOther!.email,
        },
      };
    }

    // -------------------------
    // CREATE — atomic count check + insert to prevent race condition
    // -------------------------
    const fundraiser = await this.prisma.$transaction(async (tx) => {
      const count = await tx.fundraiser.count({
        where: {
          creatorId,
          status: { notIn: ['COMPLETED', 'REJECTED'] },
        },
      });
      if (count >= 3) {
        throw new ForbiddenException('Maximum 3 fundraisers allowed');
      }
      return tx.fundraiser.create({
        data,
        include: { beneficiaryOther: true },
      });
    });

    // -------------------------
    // SEND EMAIL (AFTER SUCCESS)
    // -------------------------
    await this.mailService.sendFundraiserCreatedMail(user.email, {
      name: user.firstName ?? 'Player',
      title: fundraiser.title,
    });

    return {
      message: 'Campaign submitted for review. We’ll notify you once it’s approved.',
      fundraiser,
    };
  }

  async uploadCoverImage(
    fundraiserId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser || fundraiser.creatorId !== userId) {
      throw new BadRequestException('Unauthorized');
    }


    // Upload to S3 / local
    const coverImageURL = await this.awsS3Service.uploadProfileImage(
      file,
      `fundraisers/${fundraiserId}/cover`,
    );

    const updated = await this.prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { coverImageURL },
    });

    return {
      message: 'Cover image updated successfully.',
      fundraiser: updated,
    };
  }

  async addPlayerMedia(
    fundraiserId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser || fundraiser.creatorId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const uploadedUrls = await Promise.all(
      files.map((file) =>
        this.awsS3Service.uploadProfileImage(
          file,
          `fundraisers/${fundraiserId}/players`,
        ),
      ),
    );


    const media = await this.prisma.fundraiserMedia.upsert({
      where: { fundraiserId },
      create: { fundraiserId, playerImages: uploadedUrls, },
      update: { playerImages: { push: uploadedUrls, }, },
    });

    return {
      message: 'Media uploaded successfully.',
      media: media,
    };
  }


  private isValidYoutubeVideoId(id: string | null | undefined): boolean {
    // YouTube videoId is typically exactly 11 chars: letters, numbers, _ and -
    return !!id && /^[A-Za-z0-9_-]{11}$/.test(id);
  }

  private extractYoutubeVideoId(input: string): string | null {
    try {
      const url = new URL(input.trim());
      const host = url.hostname.replace(/^www\./, '').toLowerCase();

      // youtu.be/<id>
      if (host === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return id ?? null;
      }

      // Only allow youtube.com
      if (host !== 'youtube.com') return null;

      // youtube.com/watch?v=<id>
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }

      // youtube.com/shorts/<id> | /live/<id> | /embed/<id>
      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'live', 'embed'].includes(parts[0])) {
        return parts[1] ?? null;
      }

      return null;
    } catch {
      return null;
    }
  }

  private normalizeYoutubeUrl(input: string): string {
    const id = this.extractYoutubeVideoId(input);
    // Store as canonical watch URL to avoid duplicates across formats
    if (this.isValidYoutubeVideoId(id)) {
      return `https://www.youtube.com/watch?v=${id}`;
    }
    return input.trim();
  }

  // --- Main service method ---

  async addYoutubeMedia(
    fundraiserId: string,
    userId: string,
    youTubeUrl: string[],
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      select: { id: true, creatorId: true },
    });

    if (!fundraiser || fundraiser.creatorId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    //  Clean inputs: trim + remove empty strings
    const cleaned = (youTubeUrl ?? [])
      .map((s) => (s ?? '').trim())
      .filter(Boolean);

    if (cleaned.length === 0) {
      throw new BadRequestException('Please provide at least one YouTube URL');
    }

    //  Validate: must be YouTube video URL with 11-char videoId
    const invalid = cleaned.filter((u) => {
      const id = this.extractYoutubeVideoId(u);
      return !this.isValidYoutubeVideoId(id);
    });

    if (invalid.length) {
      throw new BadRequestException(
        `Invalid YouTube video URL(s). ${invalid.join(', ')}`,
      );
    }

    //  Normalize + dedupe request URLs
    const normalizedUnique = Array.from(
      new Set(cleaned.map((u) => this.normalizeYoutubeUrl(u))),
    );

    //  Fetch existing URLs (if any) and check duplicates
    const existing = await this.prisma.fundraiserMedia.findUnique({
      where: { fundraiserId },
      select: { youTubeUrl: true },
    });

    const existingSet = new Set(
      (existing?.youTubeUrl ?? []).map((u) => this.normalizeYoutubeUrl(u)),
    );

    const alreadyPresent = normalizedUnique.filter((u) => existingSet.has(u));

    if (alreadyPresent.length) {
      throw new BadRequestException(
        `URL is already present: ${alreadyPresent.join(', ')}`,
      );
    }

    //  Upsert into FundraiserMedia (safe to push now)
    const youtube = await this.prisma.fundraiserMedia.upsert({
      where: { fundraiserId },
      create: {
        fundraiserId,
        youTubeUrl: normalizedUnique,
      },
      update: {
        youTubeUrl: { push: normalizedUnique },
      },
    });

    return {
      message: 'YouTube links added successfully.',
      youtube,
    };
  }


  async getCampaignsByCreator(userId: string) {
    return this.prisma.fundraiser.findMany({
      where: {
        creatorId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        status: true,
        goalAmount: true,
        raisedAmount: true,
        coverImageURL: true,
        createdAt: true,
        approvedAt: true,
      },
    });
  }


  async getPublicFundraisers(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 0;
    const limit = Math.min(paginationDto.limit ?? 20, 20);
    const skip = page * limit;

    const search = paginationDto.search?.trim();

    const where: Prisma.FundraiserWhereInput = {
      status: CampaignStatus.ACTIVE,

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            sport: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            creator: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
          {
            beneficiaryUser: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
          {
            beneficiaryOther: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
    };

    const [fundraisers, total] = await this.prisma.$transaction([
      this.prisma.fundraiser.findMany({
        where,
        select: {
          id: true,
          title: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          shortDescription: true,
          coverImageURL: true,
          goalAmount: true,
          raisedAmount: true,
          sport: true,
          city: true,
          state: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      this.prisma.fundraiser.count({ where }),
    ]);

    const fundraiserIds = fundraisers.map(f => f.id);

    const supporterDonations = await this.prisma.donation.findMany({
      where: {
        fundraiserId: { in: fundraiserIds },
        status: 'SUCCESS',
      },
      select: {
        fundraiserId: true,
        donorId: true,
        guestName: true,
        isAnonymous: true,
      },
    });

    // fundraiserId → Set of supporters
    const supporterMap = new Map<string, Set<string>>();

    for (const donation of supporterDonations) {
      if (!supporterMap.has(donation.fundraiserId)) {
        supporterMap.set(donation.fundraiserId, new Set());
      }

      const set = supporterMap.get(donation.fundraiserId)!;

      // Registered user
      if (donation.donorId) {
        set.add(`USER_${donation.donorId}`);
        continue;
      }

      // Guest (non-anonymous)
      if (!donation.isAnonymous && donation.guestName) {
        set.add(`GUEST_${donation.guestName.trim().toLowerCase()}`);
        continue;
      }

      // Anonymous → count per donation
      if (donation.isAnonymous) {
        set.add(`ANON_${crypto.randomUUID()}`);
      }
    }

    const fundraisersWithSupporters = fundraisers.map(fundraiser => ({
      ...fundraiser,
      totalSupporters:
        supporterMap.get(fundraiser.id)?.size ?? 0,
    }));

    return {
      success: true,
      data: {
        page,
        limit,
        total,
        fundraisers: fundraisersWithSupporters,
      },
    };
  }

  async getCampaignById(id: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },

        beneficiaryUser: true,

        // OTHER campaign
        beneficiaryOther: true,

        media: true,// images / videos
        recipientAccount: true,
        fundraiserupdates: true,
        documents: true,

        // LATEST 5 DONORS
        donations: {
          where: {
            status: 'SUCCESS',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            donationAmount: true,
            createdAt: true,
            isAnonymous: true,
            guestName: true,
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            donations: {
              where: { status: 'SUCCESS' },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    //  Handle anonymous donors
    const donations = campaign.donations.map((donation) => {

      if (!donation.donor) {
        return {
          id: donation.id,
          donationAmount: donation.donationAmount,
          createdAt: donation.createdAt,
          donor: donation.isAnonymous
            ? {
              id: null,
              firstName: 'Anonymous',
              lastName: 'Donor',
            }
            : {
              id: null,
              firstName: donation.guestName ?? 'Guest',
              lastName: '',
            },
        };
      }
      //register anonymous donor
      if (donation.isAnonymous) {
        return {
          ...donation,
          donor: {
            id: null,
            firstName: 'Anonymous',
            lastName: 'Donor',
          },
        };
      }

      return donation;
    });

    const supporterDonations = await this.prisma.donation.findMany({
      where: {
        fundraiserId: id,
        status: 'SUCCESS',
      },
      select: {
        donorId: true,
        guestName: true,
        isAnonymous: true,
      },
    });

    const supporters = new Set<string>();

    for (const donation of supporterDonations) {
      // Registered user
      if (donation.donorId) {
        supporters.add(`USER_${donation.donorId}`);
        continue;
      }

      // Guest (non-anonymous)
      if (!donation.isAnonymous && donation.guestName) {
        supporters.add(
          `GUEST_${donation.guestName.trim().toLowerCase()}`,
        );
        continue;
      }

      // Anonymous → count each donation as 1 supporter
      if (donation.isAnonymous) {
        supporters.add(`ANON_${crypto.randomUUID()}`);
      }
    }

    const totalSupporters = supporters.size;

    // FINAL RESPONSE
    return {
      success: true,
      message: 'Campaign fetched successfully',
      totalDonations: campaign._count.donations,
      totalSupporters,
      data: {
        ...campaign,
        donations,
      },
    };
  }

  async getPublicCampaignById(id: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },

        beneficiaryUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        beneficiaryOther: true,

        media: true,
        fundraiserupdates: true,

        // LATEST 5 DONORS
        donations: {
          where: {
            status: 'SUCCESS',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            donationAmount: true,
            createdAt: true,
            isAnonymous: true,
            guestName: true,
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },

        _count: {
          select: {
            donations: {
              where: { status: 'SUCCESS' },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    //  Handle anonymous donors
    const donations = campaign.donations.map((donation) => {

      if (!donation.donor) {
        return {
          id: donation.id,
          donationAmount: donation.donationAmount,
          createdAt: donation.createdAt,
          donor: donation.isAnonymous
            ? {
              id: null,
              firstName: 'Anonymous',
              lastName: 'Donor',
            }
            : {
              id: null,
              firstName: donation.guestName ?? 'Guest',
              lastName: '',
            },
        };
      }
      //registering anonymous donor
      if (donation.isAnonymous) {
        return {
          ...donation,
          donor: {
            id: null,
            firstName: 'Anonymous',
            lastName: 'Donor',
          },
        };
      }

      return donation;
    });

    const supporterDonations = await this.prisma.donation.findMany({
      where: {
        fundraiserId: id,
        status: 'SUCCESS',
      },
      select: {
        donorId: true,
        guestName: true,
        isAnonymous: true,
      },
    });

    const supporters = new Set<string>();

    for (const donation of supporterDonations) {
      // Registered user
      if (donation.donorId) {
        supporters.add(`USER_${donation.donorId}`);
        continue;
      }

      // Guest (non-anonymous)
      if (!donation.isAnonymous && donation.guestName) {
        supporters.add(
          `GUEST_${donation.guestName.trim().toLowerCase()}`,
        );
        continue;
      }

      // Anonymous → count each donation as 1 supporter
      if (donation.isAnonymous) {
        supporters.add(`ANON_${crypto.randomUUID()}`);
      }
    }

    const totalSupporters = supporters.size;

    // FINAL RESPONSE
    return {
      success: true,
      message: 'Campaign fetched successfully',
      totalDonations: campaign._count.donations,
      totalSupporters,
      data: {
        ...campaign,
        donations,
      },
    };
  }


  async deletePlayerMedia(
    fundraiserId: string,
    userId: string,
    playerImage: string,
  ) {
    //  Validate input
    if (!playerImage) {
      throw new BadRequestException('Media URL is required');
    }

    //  Validate fundraiser ownership
    const fundraiser = await this.prisma.fundraiser.findFirst({
      where: {
        id: fundraiserId,
        creatorId: userId,
      },
    });

    if (!fundraiser) {
      throw new NotFoundException('Fundraiser not found');
    }

    //  Fetch media record
    const mediaRecord = await this.prisma.fundraiserMedia.findUnique({
      where: { fundraiserId },
    });

    if (!mediaRecord || !mediaRecord.playerImages?.length) {
      throw new NotFoundException('Fundraiser media not found');
    }

    //  Validate image exists
    if (!mediaRecord.playerImages.includes(playerImage)) {
      throw new BadRequestException('Media not found');
    }

    //  Delete file from storage (S3 / local)
    await this.awsS3Service.deleteFile(playerImage);

    //  Remove image from array
    const updatedPlayerImages = mediaRecord.playerImages.filter(
      (url) => url !== playerImage,
    );

    //  Update DB
    const deleteMedia = await this.prisma.fundraiserMedia.update({
      where: { fundraiserId },
      data: {
        playerImages: updatedPlayerImages,
      },
    });

    return {
      message: 'Media deleted successfully.',
      media: deleteMedia,
    };
  }


  async deleteYoutubeMedia(
  fundraiserId: string,
  userId: string,
  youTubeUrl: string,
) {
  //  Validate input
  if (!youTubeUrl) {
    throw new BadRequestException('YouTube URL is required');
  }

  //  Validate fundraiser ownership
  const fundraiser = await this.prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!fundraiser || fundraiser.creatorId !== userId) {
    throw new BadRequestException('Unauthorized');
  }

  //  Fetch media record
  const media = await this.prisma.fundraiserMedia.findUnique({
    where: { fundraiserId },
  });

  if (!media || !media.youTubeUrl || media.youTubeUrl.length === 0) {
    throw new BadRequestException('No YouTube media found');
  }

  // ✅ Extract target videoId (v) from incoming URL
  let targetVideoId: string | null = null;
  try {
    const parsed = new URL(youTubeUrl);
    targetVideoId =
      parsed.searchParams.get('v') ||
      (parsed.hostname === 'youtu.be' ? parsed.pathname.replace('/', '') : null);
  } catch (e) {
    throw new BadRequestException('Invalid YouTube URL');
  }

  if (!targetVideoId) {
    throw new BadRequestException('Invalid YouTube URL (missing video id)');
  }

  // ✅ Check if any stored URL has same videoId
  const exists = media.youTubeUrl.some((url) => {
    try {
      const u = new URL(url);
      const id =
        u.searchParams.get('v') ||
        (u.hostname === 'youtu.be' ? u.pathname.replace('/', '') : null);
      return id === targetVideoId;
    } catch {
      return false;
    }
  });

  if (!exists) {
    throw new BadRequestException('YouTube URL not found');
  }

  // ✅ Remove the URL(s) that match the same videoId
  const updatedUrls = media.youTubeUrl.filter((url) => {
    try {
      const u = new URL(url);
      const id =
        u.searchParams.get('v') ||
        (u.hostname === 'youtu.be' ? u.pathname.replace('/', '') : null);
      return id !== targetVideoId;
    } catch {
      // keep invalid stored strings untouched
      return true;
    }
  });

  //  Update DB
  const deleteYoutubemedia = await this.prisma.fundraiserMedia.update({
    where: { fundraiserId },
    data: {
      youTubeUrl: updatedUrls,
    },
  });

  return {
    message: 'YouTube link removed successfully.',
    youTube: deleteYoutubemedia,
  };
}

  // ─── Instagram helpers ────────────────────────────────────────────

  private isValidInstagramUrl(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      if (host !== 'instagram.com') return false;
      const parts = parsed.pathname.split('/').filter(Boolean);
      return ['p', 'reel', 'tv'].includes(parts[0]) && parts.length >= 2;
    } catch {
      return false;
    }
  }

  private normalizeInstagramUrl(url: string): string {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      if (host !== 'instagram.com') return url.trim();
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (['p', 'reel', 'tv'].includes(parts[0]) && parts.length >= 2) {
        return `https://www.instagram.com/${parts[0]}/${parts[1]}/`;
      }
      return url.trim();
    } catch {
      return url.trim();
    }
  }

  async addInstagramMedia(
    fundraiserId: string,
    userId: string,
    instagramUrls: string[],
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      select: { id: true, creatorId: true },
    });

    if (!fundraiser || fundraiser.creatorId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const cleaned = (instagramUrls ?? []).map((s) => (s ?? '').trim()).filter(Boolean);
    if (cleaned.length === 0) {
      throw new BadRequestException('Please provide at least one Instagram URL');
    }

    const invalid = cleaned.filter((u) => !this.isValidInstagramUrl(u));
    if (invalid.length) {
      throw new BadRequestException(`Invalid Instagram URL(s): ${invalid.join(', ')}`);
    }

    const normalizedUnique = Array.from(
      new Set(cleaned.map((u) => this.normalizeInstagramUrl(u))),
    );

    const existing = await this.prisma.fundraiserMedia.findUnique({
      where: { fundraiserId },
      select: { youTubeUrl: true },
    });

    const existingInstagram = new Set(
      (existing?.youTubeUrl ?? [])
        .filter((u) => u.includes('instagram.com'))
        .map((u) => this.normalizeInstagramUrl(u)),
    );

    const alreadyPresent = normalizedUnique.filter((u) => existingInstagram.has(u));
    if (alreadyPresent.length) {
      throw new BadRequestException(`URL already present: ${alreadyPresent.join(', ')}`);
    }

    const media = await this.prisma.fundraiserMedia.upsert({
      where: { fundraiserId },
      create: { fundraiserId, youTubeUrl: normalizedUnique },
      update: { youTubeUrl: { push: normalizedUnique } },
    });

    return { message: 'Instagram links added successfully.', media };
  }

  async deleteInstagramMedia(
    fundraiserId: string,
    userId: string,
    instagramUrl: string,
  ) {
    if (!instagramUrl) {
      throw new BadRequestException('Instagram URL is required');
    }

    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser || fundraiser.creatorId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const media = await this.prisma.fundraiserMedia.findUnique({
      where: { fundraiserId },
    });

    if (!media || !media.youTubeUrl?.length) {
      throw new BadRequestException('No media found');
    }

    const normalizedTarget = this.normalizeInstagramUrl(instagramUrl);
    const exists = media.youTubeUrl.some(
      (u) => u.includes('instagram.com') && this.normalizeInstagramUrl(u) === normalizedTarget,
    );

    if (!exists) {
      throw new BadRequestException('Instagram URL not found');
    }

    const updatedUrls = media.youTubeUrl.filter(
      (u) => !(u.includes('instagram.com') && this.normalizeInstagramUrl(u) === normalizedTarget),
    );

    const updated = await this.prisma.fundraiserMedia.update({
      where: { fundraiserId },
      data: { youTubeUrl: updatedUrls },
    });

    return { message: 'Instagram link removed successfully.', media: updated };
  }

  async createUpdate(fundraiserId: string, creatorId: string, dto: CreateUpdateDto) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      select: { id: true, status: true, creatorId: true },
    });

    if (!fundraiser) {
      throw new BadRequestException('Fundraiser not found');
    }

    if (fundraiser.creatorId !== creatorId) {
      throw new ForbiddenException('You are not authorized to post updates for this fundraiser');
    }

    if (fundraiser.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Updates allowed only for ACTIVE fundraisers');
    }

    const create = await this.prisma.fundraiserUpdate.create({
      data: {
        fundraiserId,
        title: dto.title,
        content: dto.content,
      },
    });

    return {
      message: 'Update posted successfully.',
      update: create,
    };
  }

  async getUpdate(fundraiserId: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      select: { id: true },
    });

    if (!fundraiser) {
      throw new BadRequestException('Fundraiser not found');
    }

    return this.prisma.fundraiserUpdate.findMany({
      where: { fundraiserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTopSixFundraised() {
    const fundraisers = await this.prisma.fundraiser.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        raisedAmount: 'desc',
      },
      take: 6,
      select: {
        id: true,
        title: true,
        sport: true,
        city: true,
        state: true,
        goalAmount: true,
        raisedAmount: true,
        shortDescription: true,
        coverImageURL: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Fetch all donations for these 6 fundraisers in one query (eliminates N+1)
    const fundraiserIds = fundraisers.map(f => f.id);
    const allDonations = await this.prisma.donation.findMany({
      where: {
        fundraiserId: { in: fundraiserIds },
        status: 'SUCCESS',
      },
      select: {
        fundraiserId: true,
        donorId: true,
        guestEmail: true,
        isAnonymous: true,
        guestName: true,
      },
    });

    // Build supporter map: fundraiserId → unique supporter count
    const supporterMap = new Map<string, Set<string>>();
    for (const d of allDonations) {
      if (!supporterMap.has(d.fundraiserId)) {
        supporterMap.set(d.fundraiserId, new Set());
      }
      const set = supporterMap.get(d.fundraiserId)!;
      if (d.donorId) {
        set.add(`USER_${d.donorId}`);
      } else if (!d.isAnonymous && d.guestEmail) {
        set.add(`GUEST_${d.guestEmail.toLowerCase()}`);
      } else {
        // anonymous — each donation counts as one unique supporter
        set.add(`ANON_${crypto.randomUUID()}`);
      }
    }

    return fundraisers.map(f => ({
      id: f.id,
      title: f.title,
      creator: {
        firstName: f.creator.firstName,
        lastName: f.creator.lastName,
      },
      shortDescription: f.shortDescription,
      coverImageURL: f.coverImageURL,
      sport: f.sport,
      city: f.city,
      state: f.state,
      goalAmount: f.goalAmount.toString(),
      raisedAmount: f.raisedAmount.toString(),
      totalSupporters: supporterMap.get(f.id)?.size ?? 0,
    }));
  }

  async review(dto: CreateReviewDto) {
    
    const createdReview = await this.prisma.review.create({
      data: {
        name: dto.name.trim(),
        rating: dto.rating,
        message: dto.message.trim(),
        isVerified: dto.isVerified,
      },
      select: {
        id: true,
        name: true,
        rating: true,
        message: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return {
      message: 'Review submitted successfully',
      review: createdReview,
    };
  }

  async reviewsPublic() {
    const reviews = await this.prisma.review.findMany({
      where: {
        isVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return reviews;
  }
}