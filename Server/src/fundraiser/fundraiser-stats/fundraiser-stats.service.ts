import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FundraiserStatsService {

    constructor(private readonly prisma: PrismaService) { }

    async getDonateWidgetStats(fundraiserId: string) {
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: {
                id: true,
                goalAmount: true,
                raisedAmount: true,
            },
        });

        if (!fundraiser) {
            throw new BadRequestException('Fundraiser not Found');
        }

        const supportersCount = await this.prisma.donation.count({
            where: {
                fundraiserId,
                status: PaymentStatus.SUCCESS,
            },
        });

        const goal = Number(fundraiser.goalAmount);
        const raised = Number(fundraiser.raisedAmount);

        const progressPercent = goal > 0 ? Math.min(100, Math.floor((raised / goal) * 100)) : 0;

        return {
            fundraiserId: fundraiser.id,
            goalAmount: fundraiser.goalAmount.toFixed(2),
            raisedAmount: fundraiser.raisedAmount.toFixed(2),
            progressPercent,
            supportersCount,
        };
    }
}
