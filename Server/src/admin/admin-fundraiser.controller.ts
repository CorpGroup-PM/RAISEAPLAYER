import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
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
import { AdminFundraiserService } from './admin-fundraiser.service';

@ApiTags('Admin Campaigns')
@ApiBearerAuth()
@Controller('admin/campaigns')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFundraiserController {
    constructor(
        private readonly adminFundraiserService: AdminFundraiserService,
    ) { }

    // ------------------------------------------------------------------
    // LIST PENDING / FILTERED CAMPAIGNS
    // ------------------------------------------------------------------
    @Get()
    @ApiOperation({
        summary: 'List campaigns by status',
        description:
            'Fetch campaigns filtered by status. Defaults to PENDING_REVIEW.',
    })
    @ApiQuery({
        name: 'status',
        enum: CampaignStatus,
        required: false,
        example: CampaignStatus.PENDING_REVIEW,
    })
    @ApiResponse({ status: 200, description: 'Campaign list fetched' })
    async listCampaigns(
        @Query('status') status?: CampaignStatus,
    ) {
        return this.adminFundraiserService.listCampaigns(
            status ?? CampaignStatus.PENDING_REVIEW,
        );
    }

    //================================
    // GET ALL DONORS
    //================================
    @Get('allDonor')
    @ApiOperation({
        summary: 'Get all donors',
        description:
            'Fetch a list of all users who have made at least one donation on the platform.',
    })
    @ApiResponse({
        status: 200,
        description: 'Donor list fetched successfully',
        example: [
            {
                id: 'don_123',
                name: 'Rahul Sharma',
                email: 'rahul@gmail.com',
                totalDonations: 5,
                totalAmount: 15000,
                lastDonationAt: '2026-01-15T10:20:30.000Z',
            },
        ],
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized – Invalid or missing access token',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden – Admin access required',
    })
    async getAllDonor() {
        return this.adminFundraiserService.getAllDonor();
    }

    //======================================
    // GET ALL USERS
    //======================================
    @Get('user/all')
    @ApiOperation({
        summary: 'Get all users',
        description:
            'Fetch all registered users on the platform including their role and account status.',
    })
    @ApiResponse({
        status: 200,
        description: 'User list fetched successfully',
        example: [
            {
                id: 'usr_456',
                firstName: 'Amit',
                lastName: 'Verma',
                email: 'amit@gmail.com',
                role: 'USER',
                isActive: true,
                createdAt: '2026-01-10T08:15:00.000Z',
            },
        ],
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized – Invalid or missing access token',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden – Admin access required',
    })
    async getAllUser() {
        return this.adminFundraiserService.getAllUser();
    }

    // ------------------------------------------------------------------
    // LIST ALL CAMPAIGNS
    // ------------------------------------------------------------------
    @Get('allCampaigns')
    @ApiOperation({
        summary: 'Get all campaigns',
        description: 'Fetch all campaigns irrespective of status',
    })
    async allCampaign() {
        return this.adminFundraiserService.getAllCampaigns();
    }

    //====================================
    //GetAll Review
    //====================================
    @Get('getAllReview/review')
     @ApiOperation({
        summary: 'Get all review',
        description: 'Fetch all review',
    })
    async getAllReview(){
        return await this.adminFundraiserService.getAllReview();
    }

    //================================
    //getAllCampaignByCreatorId
    //=================================
    @Get('campaigns-by-creator/:creatorId')
    @ApiOperation({
        summary: 'Get campaigns by creator ID (Admin)',
        description: 'Retrieves all campaigns created by a specific creator for administrative review.',
    })
    async getCampaignsByCreatorId(
        @Param('creatorId') creatorId: string,
    ) {
        return this.adminFundraiserService.getCampaignsByCreatorId(creatorId);
    }

    //----------------------------------------------------------------------
    //Getting All the Tips with info
    //----------------------------------------------------------------------
    @Get("getplatformtips")
    @ApiOperation({
        summary: 'Get all platform tips',
        description:
            'Fetch all platform tip donations along with donor name and email (registered and guest donors)',
    })
    @ApiResponse({
        status: 200,
        description: 'Platform tips fetched successfully',
        schema: {
            example: {
                success: true,
                count: 2,
                data: [
                    {
                        donationId: 'a1b2c3',
                        platformTipAmount: '25.00',
                        donorName: 'Vansh Neeraj',
                        donorEmail: 'vansh@gmail.com',
                        isGuest: false,
                        createdAt: '2026-01-07T10:30:00.000Z',
                    },
                    {
                        donationId: 'd4e5f6',
                        platformTipAmount: '10.00',
                        donorName: 'Guest User',
                        donorEmail: 'guest@gmail.com',
                        isGuest: true,
                        createdAt: '2026-01-07T11:10:00.000Z',
                    },
                ],
            },
        },
    })
    async getAllPlatformTips() {
        return this.adminFundraiserService.getAllPlatformTips();
    }

    // ------------------------------------------------------------------
    // VIEW SINGLE CAMPAIGN
    // ------------------------------------------------------------------
    @Get(':id')
    @ApiOperation({
        summary: 'View campaign details',
        description: 'Fetch full campaign details by ID',
    })
    @ApiParam({
        name: 'id',
        example: 'campaign-uuid',
    })
    async viewCampaign(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.getCampaignById(id);
    }

    // ------------------------------------------------------------------
    // APPROVE CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/approve')
    @ApiOperation({
        summary: 'Approve campaign',
        description: 'Approve a campaign submitted for review',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async approveCampaign(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.approveCampaign(id);
    }

    // ------------------------------------------------------------------
    // REJECT CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/reject')
    @ApiOperation({
        summary: 'Reject campaign',
        description: 'Reject a campaign with a rejection reason',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                rejectionReason: {
                    type: 'string',
                    example: 'Incomplete documents',
                },
            },
            required: ['rejectionReason'],
        },
    })
    async rejectCampaign(
        @Param('id') id: string,
        @Body('rejectionReason') rejectionReason: string,
    ) {
        return this.adminFundraiserService.rejectCampaign(
            id,
            rejectionReason,
        );
    }

    // ------------------------------------------------------------------
    // ACTIVATE CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/activate')
    @ApiOperation({
        summary: 'Activate campaign',
        description: 'Make an approved campaign live',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async activateCampaign(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.activateCampaign(id);
    }

    //=================================
    //  SUSPEND TO ACTIVE
    //=================================
    @Post(':id/revoke')
    @ApiOperation({
        summary: 'Reactive campaign',
        description: 'Make an reactive campaign live',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async reActiveCampaign(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.reActivateCampaign(id);
    }

    // ------------------------------------------------------------------
    // SUSPEND CAMPAIGN
    // ------------------------------------------------------------------
    @Post(':id/suspend')
    @ApiOperation({
        summary: 'Suspend campaign',
        description: 'Suspend an active campaign',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async suspendCampaign(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.suspendCampaign(id);
    }

    //=======================================
    //  COMPLETE CAMPIGN
    //=======================================
    @Post(':id/complete')
    @ApiOperation({
        summary: 'Complete campaign',
        description: 'Complete a campaign submitted for review',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async completeCampaign(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.completeCampaign(id);
    }

    // ------------------------------------------------------------------
    // VERIFY RECIPIENT ACCOUNT
    // ------------------------------------------------------------------
    @Put(':id/verify')
    @ApiOperation({
        summary: 'Verify recipient bank account',
        description: 'Mark recipient bank account as verified',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async verifyRecipientAccount(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.verifyRecipientAccount(id);
    }

    @Get(':id/userinfo')
    @ApiOperation({
        summary: 'Get user info by userId',
        description:
            'Fetch a user profile along with fundraisers created, donations made, and processed payouts.',
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'c0645752-3beb-42f8-b270-5cee8b7bda5b',
    })
    @ApiResponse({
        status: 200,
        description: 'User info fetched successfully',
        example: {
            id: 'c0645752-3beb-42f8-b270-5cee8b7bda5b',
            firstName: 'Vansh',
            lastName: 'Neeraj',
            email: 'vansh@example.com',
            phoneNumber: '9876543210',
            role: 'USER',
            createdAt: '2026-01-01T10:00:00.000Z',
            profile: {
                id: 'profile-id',
                avatarUrl: 'https://cdn.example.com/avatar.png',
                addressLine1: 'Street 1',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001',
            },
            fundraisersCreated: [
                {
                    id: 'fundraiser-id',
                    title: 'Help me train',
                    status: 'ACTIVE',
                    goalAmount: '10000.00',
                    raisedAmount: '2500.00',
                    createdAt: '2026-01-10T08:00:00.000Z',
                },
            ],
            donations: [
                {
                    id: 'donation-id',
                    fundraiserId: 'fundraiser-id',
                    donationAmount: '500.00',
                    platformTipAmount: '10.00',
                    totalAmount: '510.00',
                    currency: 'INR',
                    status: 'SUCCESS',
                    createdAt: '2026-01-12T09:00:00.000Z',
                    fundraiser: { id: 'fundraiser-id', title: 'Help me train' },
                },
            ],
            processedPayouts: [
                {
                    id: 'payout-id',
                    amount: '1000.00',
                    createdAt: '2026-01-15T10:00:00.000Z',
                    fundraiser: { id: 'fundraiser-id', title: 'Help me train' },
                },
            ],
        },
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getByUserId(@Param('id') userId: string) {
        return this.adminFundraiserService.getByUserId(userId);
    }

    //=============================
    //review approved
    //=============================
    @Post(':id/review/approve')
    @ApiOperation({
        summary: 'Review Approve',
        description: 'Reviewing Approved',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async reviewApprove(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.reviewApprove(id);
    }

    //==================================
    //delete review
    //==================================
    @Delete(':id/review/deleted')
    @ApiOperation({
        summary: 'Review Approve',
        description: 'Reviewing Approved',
    })
    @ApiParam({ name: 'id', example: 'campaign-uuid' })
    async deleteReveiw(
        @Param('id') id: string,
    ) {
        return this.adminFundraiserService.reviewdelete(id);
    }

}
