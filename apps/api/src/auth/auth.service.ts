import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { defaultCustomFieldCreateMany } from '../custom-fields/default-fields';
import {
  SYSTEM_ROLE_KEYS,
  seedSystemRoles,
} from '../common/permissions';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const slugBase = this.slugify(dto.name) || 'workspace';
    const slug = await this.uniqueWorkspaceSlug(slugBase);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${created.name}'s Workspace`,
          slug,
        },
      });

      const roles = await seedSystemRoles(tx, workspace.id);

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: created.id,
          roleId: roles[SYSTEM_ROLE_KEYS.PROJECT_MANAGER].id,
        },
      });

      await tx.customFieldDefinition.createMany({
        data: defaultCustomFieldCreateMany(workspace.id),
      });

      return created;
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
  }) {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  private async uniqueWorkspaceSlug(base: string) {
    let slug = base;
    let i = 1;
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
