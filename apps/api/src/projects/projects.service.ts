import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { tasks: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async create(workspaceId: string, userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        createdById: userId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        brief: dto.brief?.trim(),
        sections: {
          create: [{ name: 'Untitled section', position: 0 }],
        },
      },
      include: {
        _count: { select: { tasks: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return project;
  }

  async getOne(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, archivedAt: null },
      include: {
        _count: { select: { tasks: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [byStatus, overdue, blocked] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId, parentId: null },
        _count: { _all: true },
      }),
      this.prisma.task.count({
        where: {
          projectId,
          parentId: null,
          status: { not: 'DONE' },
          dueDate: { lt: startOfToday },
        },
      }),
      this.prisma.taskDependency.count({
        where: {
          task: { projectId, parentId: null, status: { not: 'DONE' } },
          dependsOn: { status: { not: 'DONE' } },
        },
      }),
    ]);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all;
    }

    return {
      ...project,
      stats: {
        byStatus: statusCounts,
        overdue,
        blocked,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      },
    };
  }

  async update(projectId: string, workspaceId: string, dto: UpdateProjectDto) {
    await this.assertInWorkspace(projectId, workspaceId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : dto.description?.trim() ?? null,
        brief:
          dto.brief === undefined ? undefined : dto.brief?.trim() ?? null,
      },
      include: {
        _count: { select: { tasks: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async archive(projectId: string, workspaceId: string) {
    await this.assertInWorkspace(projectId, workspaceId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: { archivedAt: new Date() },
    });
  }

  async getInWorkspaceOrThrow(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async assertInWorkspace(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.workspaceId !== workspaceId) {
      throw new ForbiddenException('Project does not belong to workspace');
    }
    return project;
  }
}
