import { Body, Controller, Post } from '@nestjs/common';
import { ContactusService } from './contactus.service';
import { ContactUsDto } from './dto/contactus.dto';

@Controller('contactus')
export class ContactusController {

    constructor(private readonly contactUsService: ContactusService){}

    @Post('')
    async createContactUs(@Body() dto: ContactUsDto){
        return await this.contactUsService.createContactUs(dto);
    }
}
