import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSectionDto,
  ReorderSectionsDto,
  UpdateSectionDto,
} from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefault(projectId: string) {
    const count = await this.prisma.projectSection.count({ where: { projectId } });
    if (count > 0) return;
    await this.prisma.projectSection.create({
      data: { projectId, name: 'Untitled section', position: 0 },
    });
  }

  async list(workspaceId: string, projectId: string) {
    await this.assertProject(workspaceId, projectId);
    await this.seedDefault(projectId);
    return this.prisma.projectSection.findMany({
      where: { projectId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { tasks: true } },
      },
    });
  }

  async create(
    workspaceId: string,
    projectId: string,
    dto: CreateSectionDto,
  ) {
    await this.assertProject(workspaceId, projectId);
    const count = await this.prisma.projectSection.count({ where: { projectId } });
    return this.prisma.projectSection.create({
      data: {
        projectId,
        name: dto.name.trim(),
        position: dto.position ?? count,
      },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async update(
    workspaceId: string,
    projectId: string,
    sectionId: string,
    dto: UpdateSectionDto,
  ) {
    await this.getOrThrow(workspaceId, projectId, sectionId);
    return this.prisma.projectSection.update({
      where: { id: sectionId },
      data: {
        name: dto.name?.trim(),
        position: dto.position,
      },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async remove(workspaceId: string, projectId: string, sectionId: string) {
    await this.getOrThrow(workspaceId, projectId, sectionId);
    const remaining = await this.prisma.projectSection.count({
      where: { projectId },
    });
    if (remaining <= 1) {
      throw new BadRequestException('A project must keep at least one section');
    }

    const fallback = await this.prisma.projectSection.findFirst({
      where: { projectId, NOT: { id: sectionId } },
      orderBy: { position: 'asc' },
    });
    if (!fallback) {
      throw new BadRequestException('No fallback section available');
    }

    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: { sectionId },
        data: { sectionId: fallback.id },
      }),
      this.prisma.projectSection.delete({ where: { id: sectionId } }),
    ]);
    return { ok: true, movedToSectionId: fallback.id };
  }

  async reorder(
    workspaceId: string,
    projectId: string,
    dto: ReorderSectionsDto,
  ) {
    await this.assertProject(workspaceId, projectId);
    const existing = await this.prisma.projectSection.findMany({
      where: { projectId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((s) => s.id));
    if (
      dto.sectionIds.length !== existingIds.size ||
      dto.sectionIds.some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException('sectionIds must include every section once');
    }

    await this.prisma.$transaction(
      dto.sectionIds.map((id, position) =>
        this.prisma.projectSection.update({
          where: { id },
          data: { position },
        }),
      ),
    );
    return this.list(workspaceId, projectId);
  }

  private async assertProject(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, archivedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async getOrThrow(
    workspaceId: string,
    projectId: string,
    sectionId: string,
  ) {
    await this.assertProject(workspaceId, projectId);
    const section = await this.prisma.projectSection.findFirst({
      where: { id: sectionId, projectId },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }
}
