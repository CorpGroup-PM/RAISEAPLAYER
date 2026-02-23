import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAndUpsertRecipientAccountDto } from './dto/create-update.recipient.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RecipientAccountService {

    constructor(private readonly prisma: PrismaService) { }

    async upsertRecipientAccount(fundraiserId: string,
        dto: CreateAndUpsertRecipientAccountDto
    ) {
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: { id: true },
        });

        if (!fundraiser) {
            throw new BadRequestException('fundraiser not found');
        }

        return this.prisma.recipientAccount.upsert({
            where: {
                fundraiserId,
            },
            create: {
                fundraiserId,
                recipientType: dto.recipientType,
                firstName: dto.firstName,
                lastName: dto.lastName,
                accountNumber: dto.accountNumber,
                bankName: dto.bankName,
                country: dto.country,
                ifscCode: dto.ifscCode ?? null,
                isVerified: false, 
            },

            update: {
                recipientType: dto.recipientType,
                firstName: dto.firstName,
                lastName: dto.lastName,
                accountNumber: dto.accountNumber,
                bankName: dto.bankName,
                country: dto.country,
                ifscCode: dto.ifscCode ?? null,
                isVerified: false,
            },
        });
    }
}
