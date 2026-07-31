import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/notifications')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number(limit) : 30;
    return this.notificationsService.list(
      workspaceId,
      user.id,
      Number.isFinite(parsed) ? parsed : 30,
    );
  }

  @Get('unread-count')
  unreadCount(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationsService.unreadCount(workspaceId, user.id);
  }

  @Patch(':notificationId/read')
  markRead(
    @Param('workspaceId') workspaceId: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationsService.markRead(
      workspaceId,
      user.id,
      notificationId,
    );
  }

  @Post('read-all')
  markAllRead(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationsService.markAllRead(workspaceId, user.id);
  }
}
