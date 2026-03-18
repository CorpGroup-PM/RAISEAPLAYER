import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { FoundationService } from './foundation.service';
import { CreateFoundationDonationDto } from './dto/create-foundation-donation.dto';

@ApiTags('Foundation')
@Controller('foundation')
export class FoundationController {
  constructor(private readonly foundationService: FoundationService) {}

  @Post('create-order')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a foundation development donation order' })
  @ApiBody({ type: CreateFoundationDonationDto })
  async createOrder(@Body() dto: CreateFoundationDonationDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.foundationService.createOrder(dto, userId);
  }
}
