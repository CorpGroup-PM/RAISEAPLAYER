import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransferStatus, UserRole } from '@prisma/client';

import { Roles } from 'src/common/decorators/roles.decorator';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { AdminPayoutsService } from './admin.payouts.service';
import { ProcessPayoutDto } from './dto/process-payout.dto';
import { memoryStorage } from 'multer';
import { AdminListPayoutRequestsDto } from './dto/admin-list-payout-requests.dto';
import { StatusPayoutRequestDto } from './dto/status-payout-request.dto';

@ApiTags('Admin Payouts')
@ApiBearerAuth()
@Controller('admin/payouts')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPayoutsController {
    constructor(
        private readonly adminPayoutsService: AdminPayoutsService,
    ) { }



    @Get('/list')
    @ApiOperation({
        summary: 'List payout requests (Admin)',
        description:
            'Admin review queue for payout requests with filters and pagination',
    })
    @ApiResponse({
        status: 200,
        description: 'Payout requests fetched successfully',
    })
    async list(
        @Query() query: AdminListPayoutRequestsDto,
    ) {
        return this.adminPayoutsService.listPayoutRequests({
            status: query.status,
            fundraiserId: query.fundraiserId,
            page: query.page ?? 0,
            limit: query.limit ?? 20,
        });
    }

    //List with only request
    @Get('/alllist')
    @ApiOperation({
        summary: 'List payout requests by status (Admin)',
        description: 'Returns all payout requests filtered by status (optional)',
    })
    @ApiResponse({
        status: 200,
        description: 'Payout requests fetched successfully',
    })
    async listOfPayoutswithStatus(
        @Query('status') status: TransferStatus,
    ) {
        return this.adminPayoutsService.listPayoutWithStatus(status);
    }


    //payouts approved

    @Patch(':id/approve')
    @ApiOperation({
        summary: 'Approve payout request',
        description: 'Approve a pending payout request (Admin only)',
    })
    @ApiResponse({ status: 200, description: 'Payout request approved' })
    async approve(
        @Req() req: any,
        @Param('id') requestId: string,
    ) {
        const adminId = req.user.sub;
        return this.adminPayoutsService.approvePayoutRequest(
            adminId,
            requestId,
        
        );
    }

    //processing
    @Patch(':id/processing')
    @ApiOperation({
        summary: 'Processing payout request',
        description: 'Processing a approved payout request (Admin only)',
    })
    @ApiResponse({ status: 200, description: 'Payout request approved' })
    async processed(
        @Req() req: any,
        @Param('id') requestId: string,
    ) {
        const adminId = req.user.sub;
        return this.adminPayoutsService.processingPayoutRequest(
            adminId,
            requestId,
        );
    }

    //reject

    @Patch(':id/reject')
    @ApiOperation({
        summary: 'Reject payout request',
        description: 'Reject a payout request (Admin only)',
    })
    @ApiResponse({ status: 200, description: 'Payout request rejected' })
    async reject(
        @Req() req: any,
        @Param('id') requestId: string,
        @Body() dto: StatusPayoutRequestDto,
    ) {
        const adminId = req.user.sub;
        return this.adminPayoutsService.rejectPayoutRequest(
            adminId,
            requestId,
            dto,
        );
    }

    //
    //Fail
    //
    @Patch(':id/fail')
    @ApiOperation({
        summary: 'Mark payout request as failed (Admin only)',
        description: 'Marks a payout request as failed and records the failure reason.',
    })
    @ApiBearerAuth()
    @ApiParam({
        name: 'id',
        type: String,
        example: 'uuid',
    })
    @ApiBody({ type: StatusPayoutRequestDto })
    async failPayout(
        @Req() req: any,
        @Param('id') requestId: string,
        @Body() dto: StatusPayoutRequestDto,
    ) {
        const adminId = req.user.sub;

        return this.adminPayoutsService.failPayoutRequest(
            adminId,
            requestId,
            dto,
        );
    }


    //Paid
    @Post(':requestId/process')
    @UseInterceptors(
        FileInterceptor('proofImage', {
            storage: memoryStorage(),
            limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
            fileFilter: (_, file, cb) => {
                if (!file.mimetype.match(/jpeg|jpg|png/)) {
                    return cb(
                        new BadRequestException(
                            'Only JPG, JPEG or PNG images are allowed',
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Process payout request',
        description: 'Approve or reject a payout request (Admin only)',
    })
    @ApiParam({
        name: 'requestId',
        type: String,
        example: 'uuid',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                transactionId: { type: 'string' },
                paymentDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' },
                proofImage: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async process(
        @Req() req: any,
        @Param('requestId') requestId: string,
        @Body() dto: ProcessPayoutDto,
        @UploadedFile() proofImage?: Express.Multer.File,
    ) {
        const adminUserId = req.user.sub;

        console.log({
            fileExists: !!proofImage,
            bufferExists: !!proofImage?.buffer,
            mimetype: proofImage?.mimetype,
        });

        return this.adminPayoutsService.processPayout(
            adminUserId,
            requestId,
            dto,
            proofImage,
        );
    }

}
