import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomFieldType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertCanEditTask } from '../common/task-access';
import { defaultCustomFieldCreateMany } from './default-fields';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  UpsertFieldValueDto,
} from './dto/custom-field.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(workspaceId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const existing = await client.customFieldDefinition.count({
      where: { workspaceId },
    });
    if (existing > 0) return;
    await client.customFieldDefinition.createMany({
      data: defaultCustomFieldCreateMany(workspaceId),
    });
  }

  async list(workspaceId: string) {
    await this.seedDefaults(workspaceId);
    return this.prisma.customFieldDefinition.findMany({
      where: { workspaceId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(workspaceId: string, dto: CreateCustomFieldDto) {
    if (dto.type === CustomFieldType.SINGLE_SELECT) {
      this.assertOptions(dto.options);
    }

    try {
      return await this.prisma.customFieldDefinition.create({
        data: {
          workspaceId,
          name: dto.name.trim(),
          type: dto.type,
          options:
            dto.type === CustomFieldType.SINGLE_SELECT
              ? dto.options?.map((o) => o.trim()).filter(Boolean)
              : undefined,
        },
      });
    } catch {
      throw new BadRequestException('A field with this name already exists');
    }
  }

  async update(
    workspaceId: string,
    fieldId: string,
    dto: UpdateCustomFieldDto,
  ) {
    const field = await this.getFieldOrThrow(workspaceId, fieldId);
    if (dto.options && field.type !== CustomFieldType.SINGLE_SELECT) {
      throw new BadRequestException('Options only apply to single-select fields');
    }
    if (dto.options) this.assertOptions(dto.options);

    return this.prisma.customFieldDefinition.update({
      where: { id: fieldId },
      data: {
        name: dto.name?.trim(),
        options: dto.options?.map((o) => o.trim()).filter(Boolean),
      },
    });
  }

  async remove(workspaceId: string, fieldId: string) {
    await this.getFieldOrThrow(workspaceId, fieldId);
    await this.prisma.customFieldDefinition.delete({ where: { id: fieldId } });
    return { ok: true };
  }

  async upsertValue(
    workspaceId: string,
    taskId: string,
    fieldId: string,
    userId: string,
    dto: UpsertFieldValueDto,
  ) {
    const field = await this.getFieldOrThrow(workspaceId, fieldId);
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { workspaceId: true, createdById: true } },
      },
    });
    if (!task || task.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Task not found');
    }

    await assertCanEditTask(this.prisma, workspaceId, userId, task);

    const data = this.normalizeValue(field.type, field.options, dto);

    return this.prisma.customFieldValue.upsert({
      where: { fieldId_taskId: { fieldId, taskId } },
      create: { fieldId, taskId, ...data },
      update: data,
      include: {
        field: true,
      },
    });
  }

  private normalizeValue(
    type: CustomFieldType,
    options: Prisma.JsonValue | null,
    dto: UpsertFieldValueDto,
  ) {
    if (type === CustomFieldType.TEXT || type === CustomFieldType.SINGLE_SELECT) {
      const text =
        dto.textValue === null || dto.textValue === undefined
          ? null
          : dto.textValue.trim();
      if (
        type === CustomFieldType.SINGLE_SELECT &&
        text &&
        Array.isArray(options) &&
        !options.includes(text)
      ) {
        throw new BadRequestException(`Invalid option: ${text}`);
      }
      return { textValue: text, numberValue: null, dateValue: null };
    }

    if (type === CustomFieldType.NUMBER) {
      return {
        textValue: null,
        numberValue:
          dto.numberValue === undefined || dto.numberValue === null
            ? null
            : dto.numberValue,
        dateValue: null,
      };
    }

    return {
      textValue: null,
      numberValue: null,
      dateValue: dto.dateValue ? new Date(dto.dateValue) : null,
    };
  }

  private assertOptions(options?: string[]) {
    if (!options?.length) {
      throw new BadRequestException('Single-select fields require options');
    }
  }

  private async getFieldOrThrow(workspaceId: string, fieldId: string) {
    const field = await this.prisma.customFieldDefinition.findFirst({
      where: { id: fieldId, workspaceId },
    });
    if (!field) throw new NotFoundException('Custom field not found');
    return field;
  }
}
