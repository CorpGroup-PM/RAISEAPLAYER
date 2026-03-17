import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactusService } from './contactus.service';
import { ContactUsDto } from './dto/contactus.dto';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@Controller('contactus')
export class ContactusController {

    constructor(private readonly contactUsService: ContactusService){}

    @Post('')
    @UseGuards(IpThrottlerGuard)
    @Throttle({ contact: { limit: 3, ttl: 3600000 } })
    async createContactUs(@Body() dto: ContactUsDto){
        return await this.contactUsService.createContactUs(dto);
    }
}
