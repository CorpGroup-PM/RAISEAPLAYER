import { Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminVolunteerService } from './admin-volunteer.service';

@ApiTags('Admin – Volunteers')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/volunteers')
export class AdminVolunteerController {
  constructor(private readonly adminVolunteerService: AdminVolunteerService) {}

  @Get()
  @ApiOperation({ summary: 'List all volunteer applications' })
  listVolunteers() {
    return this.adminVolunteerService.listVolunteers();
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a volunteer application' })
  @ApiParam({ name: 'id', example: 'NRPF202603270001' })
  acceptVolunteer(@Param('id') id: string) {
    return this.adminVolunteerService.acceptVolunteer(id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a volunteer application' })
  @ApiParam({ name: 'id', example: 'NRPF202603270001' })
  rejectVolunteer(@Param('id') id: string) {
    return this.adminVolunteerService.rejectVolunteer(id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities logged by a specific volunteer' })
  @ApiParam({ name: 'id', example: 'NRPF202603300001' })
  getVolunteerActivities(@Param('id') id: string) {
    return this.adminVolunteerService.getVolunteerActivities(id);
  }
}
