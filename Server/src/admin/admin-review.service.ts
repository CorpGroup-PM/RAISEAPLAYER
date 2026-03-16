import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Handles admin operations scoped to user reviews:
 * list, approve, soft-delete.
 */
@Injectable()
export class AdminReviewService {

  private readonly logger = new Logger(AdminReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Write a best-effort audit log entry. Never throws. */
  private async audit(
    adminId: string,
    action: string,
    targetId: string,
    targetTable: string,
    details?: Prisma.InputJsonObject,
  ): Promise<void> {
    try {
      await this.prisma.adminLog.create({
        data: { adminId, action, targetId, targetTable, details: details ?? {} },
      });
    } catch (err) {
      this.logger.error(
        `[AUDIT] Failed to write audit log: ${action} on ${targetTable}:${targetId}`,
        err,
      );
    }
  }

  async getAllReview(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: reviews,
    };
  }

  async reviewApprove(id: string, adminId: string) {
    const res = await this.prisma.review.updateMany({
      where: { id, isVerified: false },
      data: { isVerified: true },
    });

    if (res.count === 0) {
      throw new BadRequestException('Review not found or already approved');
    }

    await this.audit(adminId, 'REVIEW_APPROVED', id, 'Review');

    return { message: 'Approved Review' };
  }

  async reviewdelete(id: string, adminId: string) {
    const res = await this.prisma.review.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (res.count === 0) {
      throw new BadRequestException('Review not found or already deleted');
    }

    await this.audit(adminId, 'REVIEW_DELETED', id, 'Review');

    return { message: 'Review Deleted' };
  }
}
