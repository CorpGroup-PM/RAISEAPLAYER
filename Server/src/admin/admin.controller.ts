import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../common/guards/accessToken.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
export class AdminController {
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  getAdminData() {
    return { message: 'This is top secret admin data' };
  }
}
