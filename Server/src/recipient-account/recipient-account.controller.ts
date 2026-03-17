import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CreateAndUpsertRecipientAccountDto } from './dto/create-update.recipient.dto';
import { RecipientAccountService } from './recipient-account.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('recipient-account')
export class RecipientAccountController {

    constructor(private readonly recipientAccountService: RecipientAccountService) { }

    @ApiTags('Recipient Account')
    @ApiBearerAuth()
    @Post('create/:fundraiserId')
    @UseGuards(AccessTokenGuard)
    @ApiOperation({
        summary: 'Create or update recipient account (UPSERT)',
        description: `
• Creates recipient account if none exists  
• Updates existing recipient account if present  
• Only ONE recipient account per fundraiser (DB enforced)  
• Any update resets isVerified to false  
• Authentication required
  `,
    })
    @ApiParam({
        name: 'fundraiserId',
        type: String,
        required: true,
        example: 'abc-123-fundraiser',
        description: 'Fundraiser ID',
    })
    @ApiResponse({
        status: 201,
        description: 'Recipient account created or updated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 400,
        description: 'Fundraiser not found',
    })
    async upsertRecipientAccount(
        @Req() req: any,
        @Param('fundraiserId') fundraiserId: string,
        @Body() dto: CreateAndUpsertRecipientAccountDto,
    ) {
        const userId: string = req.user.sub;
        const data = await this.recipientAccountService.upsertRecipientAccount(
            fundraiserId,
            userId,
            dto,
        );

        return {
            success: true,
            message: 'Recipient account saved successfully and Updated.',
            data,
        };
    }
}
