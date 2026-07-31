import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { assertCanEditTask } from '../common/task-access';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_ROOT,
} from './upload.constants';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, taskId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId);
    return this.prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  }

  async upload(
    workspaceId: string,
    taskId: string,
    userId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File must be 10MB or smaller');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('File type is not allowed');
    }

    const task = await this.assertTaskInWorkspace(workspaceId, taskId);
    await assertCanEditTask(this.prisma, workspaceId, userId, task);

    const safeOriginal = file.originalname.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180);
    const storedName = `${randomUUID()}-${safeOriginal}`;
    const dir = join(UPLOAD_ROOT, workspaceId, taskId);
    mkdirSync(dir, { recursive: true });
    const absolutePath = join(dir, storedName);

    const { writeFileSync } = await import('fs');
    writeFileSync(absolutePath, file.buffer);

    const attachment = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: userId,
        originalName: safeOriginal || 'file',
        storedName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await this.prisma.activityEvent.create({
      data: {
        taskId,
        actorId: userId,
        type: 'ATTACHMENT_ADDED',
        meta: {
          attachmentId: attachment.id,
          name: attachment.originalName,
        },
      },
    });

    return attachment;
  }

  async download(workspaceId: string, attachmentId: string) {
    const attachment = await this.getAttachmentOrThrow(workspaceId, attachmentId);
    const absolutePath = join(
      UPLOAD_ROOT,
      workspaceId,
      attachment.taskId,
      attachment.storedName,
    );
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File missing on disk');
    }

    return {
      attachment,
      stream: createReadStream(absolutePath),
    };
  }

  async remove(workspaceId: string, attachmentId: string, userId: string) {
    const attachment = await this.getAttachmentOrThrow(workspaceId, attachmentId);
    await assertCanEditTask(this.prisma, workspaceId, userId, {
      id: attachment.taskId,
      assigneeId: attachment.task.assigneeId,
      projectId: attachment.task.projectId,
      project: attachment.task.project,
    });
    const absolutePath = join(
      UPLOAD_ROOT,
      workspaceId,
      attachment.taskId,
      attachment.storedName,
    );

    await this.prisma.taskAttachment.delete({ where: { id: attachmentId } });
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }

    await this.prisma.activityEvent.create({
      data: {
        taskId: attachment.taskId,
        actorId: userId,
        type: 'ATTACHMENT_REMOVED',
        meta: {
          attachmentId,
          name: attachment.originalName,
        },
      },
    });

    return { ok: true };
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { workspaceId: true, createdById: true } },
      },
    });
    if (!task || task.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private async getAttachmentOrThrow(workspaceId: string, attachmentId: string) {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: {
            project: { select: { workspaceId: true, createdById: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true } },
      },
    });
    if (!attachment || attachment.task.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }
}
