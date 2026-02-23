import { Injectable } from '@nestjs/common';
import { ContactUsDto } from './dto/contactus.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ContactusService {

    private readonly contactEmail = String;

    constructor(private readonly mailService: MailService,) { }

    async createContactUs(dto: ContactUsDto) {

        await this.mailService.sendContactUsMail({
            name: dto.name,
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            message: dto.message,
        });
        return {
            success: true,
            message: 'Thanks for reaching out. We’ll get back to you shortly.',
        };
    }
}

