import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateAndUpsertRecipientAccountDto } from './dto/create-update.recipient.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CryptoHelper } from 'src/common/helpers/crypto.helper';

@Injectable()
export class RecipientAccountService {

    constructor(private readonly prisma: PrismaService) { }

    async upsertRecipientAccount(
        fundraiserId: string,
        userId: string,
        dto: CreateAndUpsertRecipientAccountDto,
    ) {
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: { id: true, creatorId: true },
        });

        if (!fundraiser) {
            throw new BadRequestException('Fundraiser not found');
        }

        if (fundraiser.creatorId !== userId) {
            throw new ForbiddenException('You are not the creator of this fundraiser');
        }

        // Resolve which account number to store
        let accountNumberToSave: string;

        if (dto.accountNumber) {
            // New number provided — encrypt it
            accountNumberToSave = CryptoHelper.encryptField(dto.accountNumber);
        } else {
            // No new number — keep the existing encrypted value
            const existing = await this.prisma.recipientAccount.findUnique({
                where: { fundraiserId },
                select: { accountNumber: true },
            });
            if (!existing) {
                throw new BadRequestException('Account number is required for a new recipient account');
            }
            accountNumberToSave = existing.accountNumber;
        }

        const result = await this.prisma.recipientAccount.upsert({
            where: { fundraiserId },
            create: {
                fundraiserId,
                recipientType: dto.recipientType,
                firstName: dto.firstName,
                lastName: dto.lastName,
                accountNumber: accountNumberToSave,
                bankName: dto.bankName,
                country: dto.country,
                ifscCode: dto.ifscCode ?? null,
                isVerified: false,
            },
            update: {
                recipientType: dto.recipientType,
                firstName: dto.firstName,
                lastName: dto.lastName,
                accountNumber: accountNumberToSave,
                bankName: dto.bankName,
                country: dto.country,
                ifscCode: dto.ifscCode ?? null,
                isVerified: false,
            },
        });

        // Return masked account number to fundraiser client — never expose plaintext
        let masked = '****';
        try {
            const plain = CryptoHelper.decryptField(result.accountNumber);
            masked = '*'.repeat(Math.max(0, plain.length - 4)) + plain.slice(-4);
        } catch { /* keep '****' */ }

        return { ...result, accountNumber: masked };
    }
}
