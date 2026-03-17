import { Inject, Injectable } from '@nestjs/common';
import { CampaignStatus, DocumentVerificationStatus, PaymentStatus, Prisma, SportsDocumentType, TransferStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type Redis from 'ioredis';


function decimalToNumber(val: Prisma.Decimal | number | null | undefined): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    return Number(val.toString());
}

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) { }

    async getOverview(range: { fromDate: Date; toDate: Date }) {
        const { fromDate, toDate } = range;

        const cacheKey = `analytics:overview:${fromDate.toISOString()}:${toDate.toISOString()}`;
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch {
            // Redis unavailable — fall through to DB
        }

        const donationWhere = {
            status: PaymentStatus.SUCCESS,
            createdAt: { gte: fromDate, lte: toDate },
        } satisfies Prisma.DonationWhereInput;

        // ✅ FIX: filter payouts by createdAt
        const payoutWhere = {
            createdAt: { gte: fromDate, lte: toDate },
        } satisfies Prisma.PayoutWhereInput;

        const [
            donationAgg,
            allTimeTipAgg,
            activeFundraisers,
            pendingReviewFundraisers,
            payoutAgg,
            pendingWithdrawals,
            pendingDocuments,
            unverifiedBankAccounts,
            failedPayments,
            newUsers,
            unverifiedReviews,
            goalReachedRows,
        ] = await Promise.all([
            this.prisma.donation.aggregate({
                where: donationWhere,
                _sum: { donationAmount: true, totalAmount: true },
            }).catch(() => ({ _sum: { donationAmount: null, totalAmount: null } })),

            this.prisma.donation.aggregate({
                where: { status: PaymentStatus.SUCCESS, platformTipAmount: { gt: 0 }, createdAt: { gte: fromDate, lte: toDate } },
                _sum: { platformTipAmount: true },
            }).catch(() => ({ _sum: { platformTipAmount: null } })),

            this.prisma.fundraiser.count({
                where: { status: CampaignStatus.ACTIVE },
            }).catch(() => 0),

            this.prisma.fundraiser.count({
                where: { status: CampaignStatus.PENDING_REVIEW },
            }).catch(() => 0),

            this.prisma.payout.aggregate({
                where: payoutWhere,
                _sum: { amount: true },
            }).catch(() => ({ _sum: { amount: null } })),

            this.prisma.fundTransferRequest.count({
                where: { status: TransferStatus.PENDING },
            }).catch(() => 0),

            this.prisma.fundraiserDocument.count({
                where: { verificationStatus: DocumentVerificationStatus.PENDING },
            }).catch(() => 0),

            this.prisma.recipientAccount.count({
                where: { isVerified: false },
            }).catch(() => 0),

            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.FAILED,
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }).catch(() => 0),

            this.prisma.user.count({
                where: { createdAt: { gte: fromDate, lte: toDate } },
            }).catch(() => 0),

            this.prisma.review.count({ where: { isVerified: false } }).catch(() => 0),

            // Active campaigns where goal has been reached (raisedAmount >= goalAmount)
            this.prisma.$queryRaw<{ count: number }[]>`
                SELECT COUNT(*)::int AS count
                FROM "Fundraiser"
                WHERE status = 'ACTIVE'
                AND "raisedAmount" >= "goalAmount"
                AND "goalAmount" > 0
            `.catch(() => [{ count: 0 }]),
        ]);

        const donation = decimalToNumber(donationAgg._sum.donationAmount);
        const tip = decimalToNumber(allTimeTipAgg._sum.platformTipAmount);
        const goalReachedCampaigns = Number((goalReachedRows as any[])[0]?.count || 0);

        const result = {
            totalDonations: donation,
            platformTips: tip,

            activeFundraisers,
            pendingReviewFundraisers,
            goalReachedCampaigns,

            paidPayouts: decimalToNumber(payoutAgg._sum.amount),
            pendingWithdrawals,

            pendingDocuments,
            unverifiedBankAccounts,
            failedPayments,
            newUsers,
            unverifiedReviews,
        };

        try {
            await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
        } catch {
            // Cache write failure — not critical, return result anyway
        }

        return result;
    }

    async getFundraiserAnalytics(range: {
        fromDate: Date;
        toDate: Date;
    }) {
        const { fromDate, toDate } = range;

        // Fundraisers Created Over Time (DAY-WISE)

        const createdOverTime = await this.prisma.$queryRaw<
            { date: string; count: number }[]
        >`
    SELECT
      TO_CHAR(DATE_TRUNC('day', "created_at"), 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS count
    FROM "Fundraiser"
    WHERE "created_at" BETWEEN ${fromDate} AND ${toDate}
    GROUP BY DATE_TRUNC('day', "created_at")
    ORDER BY DATE_TRUNC('day', "created_at") ASC
  `;


        // Fundraiser Status Breakdown (CURRENT STATE)
        const statusGroup = await this.prisma.fundraiser.groupBy({
            by: ['status'],
            _count: { _all: true },
        });

        const statusBreakdown = statusGroup.map((x) => ({
            status: x.status,
            count: x._count._all,
        }));


        // Top Sports Analytics
        const sportsGroup = await this.prisma.fundraiser.groupBy({
            by: ['sport'],
            _count: { _all: true },
            _sum: { raisedAmount: true },
            orderBy: {
                _sum: { raisedAmount: 'desc' },
            },
            take: 10,
        });

        const topSports = sportsGroup.map((x) => ({
            sport: x.sport,
            fundraiserCount: x._count._all,
            totalRaised: decimalToNumber(x._sum.raisedAmount),
        }));


        // Approval Efficiency Metrics
        // Approved fundraisers count (Prisma)
        const approvedCount = await this.prisma.fundraiser.count({
            where: {
                approvedAt: { not: null },
            },
        });

        // Average approval time in HOURS (Raw SQL)
        const approvalTimeRows = await this.prisma.$queryRaw<
            { avg_hours: number | null }[]
        >`
    SELECT
      AVG(EXTRACT(EPOCH FROM ("approvedAt" - "created_at")) / 3600) AS avg_hours
    FROM "Fundraiser"
    WHERE "approvedAt" IS NOT NULL
  `;

        const averageApprovalTimeHours =
            approvalTimeRows[0]?.avg_hours ?? 0;

        return {
            createdOverTime,
            statusBreakdown,
            topSports,
            approvalEfficiency: {
                approvedCount,
                averageApprovalTimeHours: Number(
                    averageApprovalTimeHours.toFixed(2),
                ),
            },
        };
    }



    async getDonationAnalytics(range: {
        fromDate: Date;
        toDate: Date;
    }) {
        const { fromDate, toDate } = range;

        // Donations Over Time (DAY-WISE)

        const donationsOverTime = await this.prisma.$queryRaw<
            { date: string; totalAmount: number; count: number }[]
        >`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date,
        COALESCE(SUM("donationAmount"), 0)::float AS "totalAmount",
        COUNT(*)::int AS count
      FROM donations
      WHERE
        status = ${PaymentStatus.SUCCESS}
        AND created_at BETWEEN ${fromDate} AND ${toDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `;

        // Donation Status Breakdown (NO date filter)

        const statusGroup = await this.prisma.donation.groupBy({
            by: ['status'],
            _count: { _all: true },
        });

        const statusBreakdown = statusGroup.map((x) => ({
            status: x.status,
            count: x._count._all,
        }));


        // Guest vs Registered Donors (SUCCESS only)

        const [guest, registered] = await Promise.all([
            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.SUCCESS,
                    donorId: null,
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }),
            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.SUCCESS,
                    donorId: { not: null },
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }),
        ]);


        // Anonymous vs Non-Anonymous (SUCCESS only)

        const [anonymous, nonAnonymous] = await Promise.all([
            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.SUCCESS,
                    isAnonymous: true,
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }),
            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.SUCCESS,
                    isAnonymous: false,
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }),
        ]);


        //  Platform Tips Analytics (filtered by date range)

        const [tipsAgg, totalCollectedAgg] = await Promise.all([
            this.prisma.donation.aggregate({
                where: {
                    status: PaymentStatus.SUCCESS,
                    platformTipAmount: { gt: 0 },
                    createdAt: { gte: fromDate, lte: toDate },
                },
                _sum: { platformTipAmount: true },
            }),
            this.prisma.donation.aggregate({
                where: {
                    status: PaymentStatus.SUCCESS,
                    createdAt: { gte: fromDate, lte: toDate },
                },
                _sum: { totalAmount: true },
            }),
        ]);

        const totalTips = decimalToNumber(tipsAgg._sum.platformTipAmount);
        const totalCollected = decimalToNumber(totalCollectedAgg._sum.totalAmount);

        const tipPercentage =
            totalCollected > 0
                ? Number(((totalTips / totalCollected) * 100).toFixed(2))
                : 0;


        // Donation Success Rate

        const [successCount, failedCount] = await Promise.all([
            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.SUCCESS,
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }),
            this.prisma.donation.count({
                where: {
                    status: PaymentStatus.FAILED,
                    createdAt: { gte: fromDate, lte: toDate },
                },
            }),
        ]);

        const successRate =
            successCount + failedCount > 0
                ? Number(
                    (
                        (successCount / (successCount + failedCount)) *
                        100
                    ).toFixed(2),
                )
                : 0;

        return {
            donationsOverTime,
            statusBreakdown,
            guestVsRegistered: {
                guest,
                registered,
            },
            anonymousBreakdown: {
                anonymous,
                nonAnonymous,
            },
            platformTips: {
                totalTips,
                tipPercentage,
            },
            successRate,
        };
    }


    async getWithdrawalsAnalytics() {
        const statusRaw = await this.prisma.$queryRaw<
            { status: string; count: Number; totalAmount: number }[]
        >`
        SELECT
            status:: text AS status,
            COUNT(*)::int AS count,
            COALESCE(SUM(amount),0)::float AS "totalAmount"
        FROM "FundTransferRequest"
        GROUP BY status
        `;

        const STATUS_ORDER = [
            'PENDING',
            'APPROVED',
            'PROCESSING',
            'PAID',
            'FAILED',
            'REJECTED',
            'CANCELLED',
        ];

        const statusMap = new Map(statusRaw.map(x => [
            String(x.status).toUpperCase(),
            {
                count: Number(x.count),
                totalAmount: Number(x.totalAmount),
            },
        ]),
        );

        const statusPipeline = STATUS_ORDER.map(status => ({
            status,
            count: statusMap.get(status)?.count || 0,
            totalAmount: Number(
                (statusMap.get(status)?.totalAmount || 0).toFixed(2),
            ),
        }));

        const totalRow = await this.prisma.$queryRaw< {
            count: number; totalAmount: number
        }[]
        >`
            SELECT 
                COUNT(*)::int AS count,
                COALESCE(SUM(amount),0):: float AS "totalAmount"
            FROM "FundTransferRequest"
            `;

        const totals = {
            count: Number(totalRow?.[0]?.count || 0),
            totalAmount: Number((totalRow?.[0]?.totalAmount || 0).toFixed(2)),
        };

        // Processing efficiency: count of PAID requests + avg hours from created → processedAt
        const [processedCount, avgHoursRows] = await Promise.all([
            this.prisma.fundTransferRequest.count({
                where: { status: TransferStatus.PAID },
            }),
            this.prisma.$queryRaw<{ avg_hours: number | null }[]>`
                SELECT AVG(
                    EXTRACT(EPOCH FROM ("processedAt" - "createdAt")) / 3600
                ) AS avg_hours
                FROM "FundTransferRequest"
                WHERE status = 'PAID' AND "processedAt" IS NOT NULL
            `,
        ]);

        const processingEfficiency = {
            processedCount,
            averageProcessingTimeHours: Number(
                (avgHoursRows[0]?.avg_hours ?? 0).toFixed(2),
            ),
        };

        return {
            statusPipeline,
            totals,
            processingEfficiency,
        };
    }

    async getPaidPayouts(params?: {
        fromDate?: Date;
        toDate?: Date;
    }) {
        const { fromDate, toDate } = params || {};

        const endOfDay = (date?: Date) => {
            if (!date) return undefined;
            const d = new Date(date);
            d.setUTCHours(23, 59, 59, 999);
            return d;
        };

        const rows = await this.prisma.fundTransferRequest.findMany({
            where: {
                status: 'PAID',
                ...(fromDate || toDate
                    ? {
                        processedAt: {
                            ...(fromDate && { gte: fromDate }),
                            ...(toDate && { lte: endOfDay(toDate) }),
                        },
                    }
                    : {}),
            },

            select: {
                fundraiserId:true,
                amount: true,
                status: true,
                processedAt: true,
            },

            orderBy: {
                processedAt: 'desc',
            },
        });

        const totalPaidAmount = rows.reduce(
            (sum, r) => sum + Number(r.amount),
            0,
        );

        return {
            totalPaidAmount,
            totalPayouts: rows.length,
            payouts: rows,
        };
    }

    async getDocumentsAnalytics() {

        //  Document Verification Status Breakdown

        const statusGroup =
            await this.prisma.fundraiserDocument.groupBy({
                by: ['verificationStatus'],
                _count: { _all: true },
            });

        const statusBreakdown = statusGroup.map((x) => ({
            status: x.verificationStatus,
            count: x._count._all,
        }));


        //  Document Type Breakdown

        const typeGroup =
            await this.prisma.fundraiserDocument.groupBy({
                by: ['type'],
                _count: { _all: true },
            });

        const typeMap = new Map<string, number>();
        for (const row of typeGroup) {
            typeMap.set(row.type, row._count._all);
        }

        const typeBreakdown = Object.values(
            SportsDocumentType,
        ).map((type) => ({
            type,
            count: typeMap.get(type) ?? 0,
        }));


        //  Pending Document Review Table
        const pendingDocuments =
            await this.prisma.fundraiserDocument.findMany({
                where: {
                    verificationStatus:
                        DocumentVerificationStatus.PENDING,
                },
                select: {
                    id: true,
                    fundraiserId: true,
                    type: true,
                    fileUrl: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });

        //  Verified (Approved) Documents Table
        const verifiedDocuments =
            await this.prisma.fundraiserDocument.findMany({
                where: {
                    verificationStatus: DocumentVerificationStatus.VERIFIED,
                },
                select: {
                    id: true,
                    fundraiserId: true,
                    type: true,
                    fileUrl: true,
                    createdAt: true,
                    verifiedAt: true,
                },
                orderBy: { verifiedAt: 'desc' },
            });

        return {
            statusBreakdown,
            typeBreakdown,
            pendingDocuments,
            verifiedDocuments,
        };
    }
}

