import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { FundraiserService } from './fundraiser.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { CreateFundraiserDto } from './dto/fundraiser.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { createFileInterceptorOptions } from 'src/common/upload/file-upload.helper';
import { validateUploadedFile } from 'src/common/upload/validate-uploaded-file';
import { PaginationDto } from './dto/pagination.dto';
import { CreateUpdateDto } from './dto/create-update.dto';
import { AddYoutubeMediaDto } from './dto/addyoutubemedia.dto';
import { CreateReviewDto, } from './dto/review.dto';

@ApiTags('Fundraisers')
@Controller('fundraiser')
export class FundraiserController {
  constructor(
    private readonly fundraiserService: FundraiserService,
  ) { }

  // ------------------------------------------------------------------
  // CREATE FUNDRAISER
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Post('create')
  @ApiOperation({
    summary: 'Create a new fundraiser',
    description: 'Creates a new fundraising campaign for the authenticated user.',
  })
  @ApiBody({ type: CreateFundraiserDto })
  async createFundraiser(
    @Body() dto: CreateFundraiserDto,
    @Req() req: any,
  ) {
    return this.fundraiserService.createFundraiser(
      dto,
      req.user.sub,
    );
  }

  //==========================================
  //TOP 6 FUNDRAISED Public route
  //==========================================

  @Get('fundraisedtopsix')
  async getTopSixFundraised() {
    return this.fundraiserService.getTopSixFundraised();
  }

  // ------------------------------------------------------------------
  // UPLOAD COVER IMAGE
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Put(':id/cover-image')
  @ApiOperation({
    summary: 'Upload fundraiser cover image',
    description: 'Uploads or updates the cover image for a specific fundraiser.',
  })
  @ApiParam({ name: 'id', example: 'fundraiser-uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createFileInterceptorOptions({
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSizeMB: 5,
      }),
    ),
  )
  async uploadCoverImage(
    @Param('id') fundraiserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    await validateUploadedFile(
      file,
      ['image/jpeg', 'image/png', 'image/webp'],
      5,
    );

    return this.fundraiserService.uploadCoverImage(
      fundraiserId,
      req.user.sub,
      file,
    );
  }

  // ------------------------------------------------------------------
  // UPLOAD PLAYER IMAGES
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Post(':id/media/player')
  @ApiOperation({
    summary: 'Upload player images',
    description: 'Uploads one or more player images associated with a fundraiser.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        players: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor(
      'players',
      10,
      createFileInterceptorOptions({
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSizeMB: 3,
      }),
    ),
  )
  async uploadPlayerImages(
    @Param('id') fundraiserId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    await Promise.all(
      files.map((file) =>
        validateUploadedFile(file, ['image/jpeg', 'image/png', 'image/webp'], 3),
      ),
    );

    return this.fundraiserService.addPlayerMedia(
      fundraiserId,
      req.user.sub,
      files,
    );
  }

  // ------------------------------------------------------------------
  // ADD YOUTUBE LINKS
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Post(':id/media/youtube')
  @ApiOperation({
    summary: 'Add YouTube media links',
    description: 'Adds YouTube video links to a fundraiser for media showcase.',
  })
  @ApiBody({ type: AddYoutubeMediaDto })
  async addYoutube(
    @Param('id') fundraiserId: string,
    @Req() req: any,
    @Body() dto: AddYoutubeMediaDto,
  ) {
    return this.fundraiserService.addYoutubeMedia(
      fundraiserId,
      req.user.sub,
      dto.youtubeUrl,
    );
  }

  // ------------------------------------------------------------------
  // MY CAMPAIGNS
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Get('/me/campaigns')
  @ApiOperation({
    summary: 'Get my campaigns',
    description: 'Retrieves all fundraising campaigns created by the authenticated user.',
  })
  async getMyCampaigns(@Req() req: any) {
    return this.fundraiserService.getCampaignsByCreator(
      req.user.sub,
    );
  }

  // ------------------------------------------------------------------
  // VIEW CAMPAIGN (PRIVATE)
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'View fundraiser details (private)',
    description: 'Retrieves detailed information of a fundraiser for the authenticated creator.',
  })
  async viewCampaign(@Param('id') id: string) {
    return this.fundraiserService.getCampaignById(id);
  }

  //-------------------------------------------------------------------
  //VIEW PUblic CAMPAIGN 
  //-------------------------------------------------------------------
  @Get(':id/public')
  @ApiOperation({
    summary: 'View fundraiser details (public)',
    description: 'Retrieves public details of a fundraiser visible to all users.',
  })
  async getPublicCampaignById(@Param('id') id: string) {
    return this.fundraiserService.getPublicCampaignById(id);
  }

  // ------------------------------------------------------------------
  // PUBLIC FUNDRAISERS
  // ------------------------------------------------------------------
  @Get('fundraisers/user')
  @ApiOperation({
    summary: 'Get public fundraisers',
    description: 'Retrieves a list of active public fundraising campaigns.',
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'search', required: false })
  getPublicFundraisers(
    @Query() paginationDto: PaginationDto,
  ) {
    return this.fundraiserService.getPublicFundraisers(paginationDto);
  }

  // ------------------------------------------------------------------
  // DELETE PLAYER IMAGE
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Delete(':id/media/player')
  @ApiOperation({
    summary: 'Delete player image',
    description: 'Deletes a specific player image from a fundraiser.',
  })
  async deleteSinglePlayerMedia(
    @Param('id') fundraiserId: string,
    @Body('playerImage') playerImage: string,
    @Req() req: any,
  ) {
    return this.fundraiserService.deletePlayerMedia(
      fundraiserId,
      req.user.sub,
      playerImage,
    );
  }

  // ------------------------------------------------------------------
  // DELETE YOUTUBE LINK
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Delete(':id/media/youtube')
  @ApiOperation({
    summary: 'Delete YouTube media link',
    description: 'Removes a YouTube media link from a fundraiser.',
  })
  async deleteYoutubeMedia(
    @Param('id') fundraiserId: string,
    @Body('youTubeUrl') youTubeUrl: string,
    @Req() req: any,
  ) {
    return this.fundraiserService.deleteYoutubeMedia(
      fundraiserId,
      req.user.sub,
      youTubeUrl,
    );
  }

  // ------------------------------------------------------------------
  // ADD INSTAGRAM LINKS
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Post(':id/media/instagram')
  @ApiOperation({ summary: 'Add Instagram media links' })
  async addInstagram(
    @Param('id') fundraiserId: string,
    @Req() req: any,
    @Body('instagramUrl') instagramUrl: string | string[],
  ) {
    const urls = Array.isArray(instagramUrl) ? instagramUrl : [instagramUrl];
    return this.fundraiserService.addInstagramMedia(fundraiserId, req.user.sub, urls);
  }

  // ------------------------------------------------------------------
  // DELETE INSTAGRAM LINK
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Delete(':id/media/instagram')
  @ApiOperation({ summary: 'Delete Instagram media link' })
  async deleteInstagramMedia(
    @Param('id') fundraiserId: string,
    @Body('instagramUrl') instagramUrl: string,
    @Req() req: any,
  ) {
    return this.fundraiserService.deleteInstagramMedia(
      fundraiserId,
      req.user.sub,
      instagramUrl,
    );
  }

  // ------------------------------------------------------------------
  // Create FUNDRAISER UPDATE
  // ------------------------------------------------------------------
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Post(':fundraiserId/updates')
  @ApiOperation({
    summary: 'Create fundraiser update',
    description: 'Creates a new update post for a fundraiser to inform supporters.',
  })
  @ApiBody({ type: CreateUpdateDto })
  async createUpdate(
    @Param('fundraiserId') fundraiserId: string,
    @Body() dto: CreateUpdateDto,
    @Req() req: any,
  ) {
    return await this.fundraiserService.createUpdate(
      fundraiserId,
      req.user.sub,
      dto,
    );
  }
  //==============================================================
  //Get all Update by Id
  //==============================================================
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Get(':fundraiserId/getupdates')
  @ApiOperation({
    summary: 'Get fundraiser updates',
    description: 'Retrieves all updates posted for a specific fundraiser.',
  })
  async addUpdate(
    @Param('fundraiserId') fundraiserId: string,
  ) {
    return await this.fundraiserService.getUpdate(
      fundraiserId,
    );
  }

  //=======================================
  //Review 
  //=======================================
  @Post('/review')
  async review( @Body() dto: CreateReviewDto) {
    return await this.fundraiserService.review(
      dto,);
  }

  //============================================
  //  public route  review
  // ===========================================
  @Get('review/publics')
  async reviewsPublic() {
    return await this.fundraiserService.reviewsPublic();
  }

}
