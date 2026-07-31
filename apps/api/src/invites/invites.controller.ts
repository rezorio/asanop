import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { AcceptInviteDto } from '../workspaces/dto/workspace.dto';
import { CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get(':token')
  preview(@Param('token') token: string) {
    return this.invitesService.preview(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept')
  accept(@CurrentUser() user: AuthUser, @Body() dto: AcceptInviteDto) {
    return this.invitesService.accept(dto.token, user.id);
  }
}
