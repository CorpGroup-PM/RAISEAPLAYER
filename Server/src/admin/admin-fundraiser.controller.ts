import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { CampaignStatus, UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminCampaignService } from './admin-fundraiser.service';
import { AdminUserService } from './admin-user.service';
import { AdminReviewService } from './admin-review.service';
import { AdminBankAccountService } from './admin-bank-account.service';

@ApiTags('Admin Campaigns')
@ApiBearerAuth()
@Controller('admin/campaigns')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFundraiserController {
    constructor(
        private readonly campaignService: AdminCampaignService,
        private readonly userService: AdminUserService,
        private readonly reviewService: AdminReviewService,
        private readonly bankAccountService: AdminBankAccountService,
    ) {}

    // ------------------------------------------------------------------
    // LIST PENDING / FILTERED CAMPAIGNS
    // ------------------------------------------------------------------
    @Get()
    @ApiOperation({
        summary: 'List campaigns by status',
        description: 'Fetch campaigns filtered by status. Defaults to PENDING_REVIEW.',
    })
    @ApiQuery({ name: 'status', enum: CampaignStatus, required: false, example: CampaignStatus.PENDING_REVIEW })
    @ApiResponse({ status: 200, description: 'Campaign list fetched' })
    async listCampaigns(@Query('status') status?: CampaignStatus) {
        return this.campaignService.listCampaigns(status ?? CampaignStatus.PENDING_REVIEW);
    }

    // ------------------------------------------------------------------
    // GET ALL DONORS
    // ------------------------------------------------------------------
    @Get('allDonor')
    @ApiOperation({ summary: 'Get all donors' })
    @ApiQuery({ name: 'page',  required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    async getAllDonor(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
        const parsedPage  = Math.max(1, parseInt(page  ?? '1',  10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
        return this.userService.getAllDonor(parsedPage, parsedLimit, status);
    }

    // ------------------------------------------------------------------
    // GET ALL USERS
    // ------------------------------------------------------------------
    @Get('user/all')
    @ApiOperation({ summary: 'Get all users' })
    @ApiQuery({ name: 'page',  required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
    async getAllUser(@Query('page') page?: string, @Query('limit') limit?: string) {
        const parsedPage  = Math.max(1, parseInt(page  ?? '1',  10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
        return this.userService.getAllUser(parsedPage, parsedLimit);
    }

    // ------------------------------------------------------------------
    // LIST ALL CAMPAIGNS
    // ------------------------------------------------------------------
    @Get('allCampaigns')
    @ApiOperation({ summary: 'Get all campaigns' })
    @ApiQuery({ name: 'page',  required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
    async allCampaign(@Query('page') page?: string, @Query('limit') limit?: string) {
        const parsedPage  = Math.max(1, parseInt(page  ?? '1',  10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
        return this.campaignService.getAllCampaigns(parsedPage, parsedLimit);
    }

    // ------------------------------------------------------------------
    // GET ALL REVIEWS
    // ------------------------------------------------------------------
    @Get('getAllReview/review')
    @ApiOperation({ summary: 'Get all reviews' })
    @ApiQuery({ name: 'page',  required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    async getAllReview(@Query('page') page?: string, @Query('limit') limit?: string) {
        const parsedPage  = Math.max(1, parseInt(page  ?? '1',  10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
        return this.reviewService.getAllReview(parsedPage, parsedLimit);
    }

    // ------------------------------------------------------------------
    // GET CAMPAIGNS BY CREATOR
    // ------------------------------------------------------------------
    @Get('campaigns-by-creator/:creatorId')
    @ApiOperation({ summary: 'Get campaigns by creator ID (Admin)' })
    async getCampaignsByCreatorId(@Param('creatorId') creatorId: string) {
        return this.campaignService.getCampaignsByCreatorId(creatorId);
    }

    // ------------------------------------------------------------------
    // LIST BANK / RECIPIENT ACCOUNTS
    // ------------------------------------------------------------------
    @Get('bank-accounts')
    @ApiOperation({ summary: 'List recipient bank accounts' })
    @ApiQuery({ name: 'unverified', required: false, type: Boolean })
    async listBankAccounts(@Query('unverified') unverified?: string) {
        return this.bankAccountService.listRecipientAccounts(unverified === 'true');
    }

    // ------------------------------------------------------------------
    // GET ALL PLATFORM TIPS
    // ------------------------------------------------------------------
    @Get('getplatformtips')
    @ApiOperation({ summary: 'Get all platform tips' })
    @ApiQuery({ name: 'page',  required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    async getAllPlatformTips(@Query('page') page?: string, @Query('limit') limit?: string) {
        const parsedPage  = Math.max(1, parseInt(page  ?? '1',  10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
        return this.userService.getAllPlatformTips(parsedPage, parsedLimit);
    }

    // ------------------------------------------------------------------
    // STATUS COUNTS — single query replaces N parallel status requests
    // ------------------------------------------------------------------
    @Get('status-counts')
    @ApiOperation({ summary: 'Get campaign count per status (single DB query)' })
    async getStatusCounts() {
        return this.campaignService.getStatusCounts();
    }

    // ------------------------------------------------------------------
    // VIEW SINGLE CAMPAIGN
    // ------------------------------------------------------------------
    @Get(':id')
    @ApiOperation({ summary: 'View campaign details' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async viewCampaign(@Param('id') id: string) {
        return this.campaignService.getCampaignById(id);
    }

    // ------------------------------------------------------------------
    // APPROVE CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/approve')
    @ApiOperation({ summary: 'Approve campaign' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async approveCampaign(@Param('id') id: string, @Req() req: any) {
        return this.campaignService.approveCampaign(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // REJECT CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/reject')
    @ApiOperation({ summary: 'Reject campaign' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { rejectionReason: { type: 'string', example: 'Incomplete documents' } },
            required: ['rejectionReason'],
        },
    })
    async rejectCampaign(
        @Param('id') id: string,
        @Body('rejectionReason') rejectionReason: string,
        @Req() req: any,
    ) {
        return this.campaignService.rejectCampaign(id, rejectionReason, req.user.sub);
    }

    // ------------------------------------------------------------------
    // ACTIVATE CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/activate')
    @ApiOperation({ summary: 'Activate campaign' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async activateCampaign(@Param('id') id: string, @Req() req: any) {
        return this.campaignService.activateCampaign(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // REACTIVATE (SUSPENDED → ACTIVE)
    // ------------------------------------------------------------------
    @Post(':id/revoke')
    @ApiOperation({ summary: 'Reactivate campaign from SUSPENDED' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async reActiveCampaign(@Param('id') id: string, @Req() req: any) {
        return this.campaignService.reActivateCampaign(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // SUSPEND CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/suspend')
    @ApiOperation({ summary: 'Suspend campaign' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async suspendCampaign(@Param('id') id: string, @Req() req: any) {
        return this.campaignService.suspendCampaign(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // COMPLETE CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/complete')
    @ApiOperation({ summary: 'Complete campaign' })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async completeCampaign(@Param('id') id: string, @Req() req: any) {
        return this.campaignService.completeCampaign(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // VERIFY RECIPIENT ACCOUNT
    // ------------------------------------------------------------------
    @Put(':id/verify')
    @ApiOperation({ summary: 'Verify recipient bank account' })
    @ApiParam({ name: 'id', example: 'account-uuid' })
    async verifyRecipientAccount(@Param('id') id: string, @Req() req: any) {
        return this.bankAccountService.verifyRecipientAccount(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // GET USER BY ID
    // ------------------------------------------------------------------
    @Get(':id/userinfo')
    @ApiOperation({ summary: 'Get user info by userId' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getByUserId(@Param('id') userId: string) {
        return this.userService.getByUserId(userId);
    }

    // ------------------------------------------------------------------
    // REVIEW APPROVE
    // ------------------------------------------------------------------
    @Post(':id/review/approve')
    @ApiOperation({ summary: 'Approve a review' })
    @ApiParam({ name: 'id', example: 'review-uuid' })
    async reviewApprove(@Param('id') id: string, @Req() req: any) {
        return this.reviewService.reviewApprove(id, req.user.sub);
    }

    // ------------------------------------------------------------------
    // REVIEW DELETE
    // ------------------------------------------------------------------
    @Delete(':id/review/deleted')
    @ApiOperation({ summary: 'Soft-delete a review' })
    @ApiParam({ name: 'id', example: 'review-uuid' })
    async deleteReveiw(@Param('id') id: string, @Req() req: any) {
        return this.reviewService.reviewdelete(id, req.user.sub);
    }
}
