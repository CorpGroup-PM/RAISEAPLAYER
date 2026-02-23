import { Module } from '@nestjs/common';
import { RecipientAccountController } from './recipient-account.controller';
import { RecipientAccountService } from './recipient-account.service';

@Module({
  controllers: [RecipientAccountController],
  providers: [RecipientAccountService]
})
export class RecipientAccountModule {}
