import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(workspaceId: string, rawQuery: string) {
    const q = rawQuery.trim();
    if (q.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }

    const [tasks, projects, people] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          project: { workspaceId, archivedAt: null },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          parentId: true,
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.project.findMany({
        where: {
          workspaceId,
          archivedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { tasks: true } },
        },
      }),
      this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 10,
        include: {
          user: { select: { id: true, name: true, email: true } },
          role: { select: { name: true, key: true } },
        },
      }),
    ]);

    return {
      query: q,
      tasks,
      projects,
      people: people.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        roleName: m.role.name,
        roleKey: m.role.key,
      })),
    };
  }
}
