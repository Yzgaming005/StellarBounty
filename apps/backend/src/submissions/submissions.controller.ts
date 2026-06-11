import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSubmissionDto } from './submissions.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('submissions')
@Controller('bounties/:bountyId/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit work for a bounty' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('bountyId') bountyId: string,
    @Body() dto: CreateSubmissionDto,
    @Request() req: { user: { address: string } },
  ) {
    return this.submissionsService.create(bountyId, dto, req.user.address);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all submissions for a bounty (owner only)' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Param('bountyId') bountyId: string,
    @Request() req: { user: { address: string } },
  ) {
    return this.submissionsService.findAll(bountyId, req.user.address);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve a submission and release payment' })
  @UseGuards(JwtAuthGuard)
  @Patch(':subId/approve')
  approve(
    @Param('bountyId') bountyId: string,
    @Param('subId') subId: string,
    @Request() req: { user: { address: string } },
  ) {
    return this.submissionsService.approve(bountyId, subId, req.user.address);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reject a submission' })
  @UseGuards(JwtAuthGuard)
  @Patch(':subId/reject')
  reject(
    @Param('bountyId') bountyId: string,
    @Param('subId') subId: string,
    @Request() req: { user: { address: string } },
  ) {
    return this.submissionsService.reject(bountyId, subId, req.user.address);
  }
}
