import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';
import { MAX_UPLOAD_BYTES } from './upload.constants';

@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('tasks/:taskId/attachments')
  list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.attachmentsService.list(workspaceId, taskId);
  }

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  upload(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(workspaceId, taskId, user.id, file);
  }

  @Get('attachments/:attachmentId/download')
  async download(
    @Param('workspaceId') workspaceId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { attachment, stream } = await this.attachmentsService.download(
      workspaceId,
      attachmentId,
    );
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.originalName.replace(/"/g, '')}"`,
    );
    stream.pipe(res);
  }

  @Delete('attachments/:attachmentId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.remove(workspaceId, attachmentId, user.id);
  }
}
