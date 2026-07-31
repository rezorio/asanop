import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AutomationTrigger,
  IntakeFormFieldType,
  TaskStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { AutomationsService } from '../automations/automations.service';
import {
  CreateIntakeFormDto,
  CreateIntakeFormFieldDto,
  SubmitIntakeFormDto,
  UpdateIntakeFormDto,
  UpdateIntakeFormFieldDto,
} from './dto/intake-form.dto';

const formInclude = {
  project: { select: { id: true, name: true } },
  defaultAssignee: { select: { id: true, name: true, email: true } },
  fields: { orderBy: { position: 'asc' as const } },
} as const;

@Injectable()
export class IntakeFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tasks: TasksService,
    private readonly customFields: CustomFieldsService,
    private readonly automations: AutomationsService,
  ) {}

  list(workspaceId: string) {
    return this.prisma.intakeForm.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: formInclude,
    }).then((forms) => forms.map((f) => this.withShareUrl(f)));
  }

  async getOne(workspaceId: string, formId: string) {
    const form = await this.prisma.intakeForm.findFirst({
      where: { id: formId, workspaceId },
      include: formInclude,
    });
    if (!form) throw new NotFoundException('Form not found');
    return this.withShareUrl(form);
  }

  async create(workspaceId: string, userId: string, dto: CreateIntakeFormDto) {
    await this.assertProject(workspaceId, dto.projectId);
    if (dto.defaultAssigneeId) {
      await this.assertMember(workspaceId, dto.defaultAssigneeId);
    }

    const token = randomBytes(24).toString('hex');
    const form = await this.prisma.intakeForm.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        token,
        createdById: userId,
        defaultAssigneeId: dto.defaultAssigneeId || null,
        defaultStatus: dto.defaultStatus ?? TaskStatus.TODO,
        titleTemplate: dto.titleTemplate?.trim(),
        fields: {
          create: [
            {
              key: 'title',
              label: 'Title',
              type: IntakeFormFieldType.TITLE,
              required: true,
              position: 0,
            },
            {
              key: 'description',
              label: 'Description',
              type: IntakeFormFieldType.DESCRIPTION,
              required: false,
              position: 1,
            },
          ],
        },
      },
      include: formInclude,
    });
    return this.withShareUrl(form);
  }

  async update(
    workspaceId: string,
    formId: string,
    dto: UpdateIntakeFormDto,
  ) {
    await this.getRaw(workspaceId, formId);
    if (dto.projectId) {
      await this.assertProject(workspaceId, dto.projectId);
    }
    if (dto.defaultAssigneeId) {
      await this.assertMember(workspaceId, dto.defaultAssigneeId);
    }

    const form = await this.prisma.intakeForm.update({
      where: { id: formId },
      data: {
        name: dto.name?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : dto.description?.trim() ?? null,
        projectId: dto.projectId,
        defaultAssigneeId:
          dto.defaultAssigneeId === undefined
            ? undefined
            : dto.defaultAssigneeId,
        defaultStatus: dto.defaultStatus,
        titleTemplate:
          dto.titleTemplate === undefined
            ? undefined
            : dto.titleTemplate?.trim() ?? null,
        isActive: dto.isActive,
      },
      include: formInclude,
    });
    return this.withShareUrl(form);
  }

  async remove(workspaceId: string, formId: string) {
    await this.getRaw(workspaceId, formId);
    await this.prisma.intakeForm.delete({ where: { id: formId } });
    return { ok: true };
  }

  async addField(
    workspaceId: string,
    formId: string,
    dto: CreateIntakeFormFieldDto,
  ) {
    await this.getRaw(workspaceId, formId);
    if (dto.type === IntakeFormFieldType.TITLE) {
      throw new BadRequestException('Title field already exists on the form');
    }
    if (
      dto.type === IntakeFormFieldType.SINGLE_SELECT &&
      !dto.options?.length
    ) {
      throw new BadRequestException('Single-select fields require options');
    }
    if (dto.customFieldId) {
      await this.assertCustomField(workspaceId, dto.customFieldId);
    }

    const count = await this.prisma.intakeFormField.count({ where: { formId } });
    try {
      return await this.prisma.intakeFormField.create({
        data: {
          formId,
          key: dto.key.trim().toLowerCase().replace(/\s+/g, '_'),
          label: dto.label.trim(),
          type: dto.type,
          required: dto.required ?? false,
          options: dto.options?.map((o) => o.trim()).filter(Boolean),
          customFieldId: dto.customFieldId || null,
          position: dto.position ?? count,
        },
      });
    } catch {
      throw new BadRequestException('A field with this key already exists');
    }
  }

  async updateField(
    workspaceId: string,
    formId: string,
    fieldId: string,
    dto: UpdateIntakeFormFieldDto,
  ) {
    const field = await this.getField(workspaceId, formId, fieldId);
    if (dto.options && field.type !== IntakeFormFieldType.SINGLE_SELECT) {
      throw new BadRequestException('Options only apply to single-select');
    }
    if (dto.customFieldId) {
      await this.assertCustomField(workspaceId, dto.customFieldId);
    }

    return this.prisma.intakeFormField.update({
      where: { id: fieldId },
      data: {
        label: dto.label?.trim(),
        required: dto.required,
        options: dto.options?.map((o) => o.trim()).filter(Boolean),
        customFieldId:
          dto.customFieldId === undefined ? undefined : dto.customFieldId,
        position: dto.position,
      },
    });
  }

  async removeField(workspaceId: string, formId: string, fieldId: string) {
    const field = await this.getField(workspaceId, formId, fieldId);
    if (field.type === IntakeFormFieldType.TITLE) {
      throw new BadRequestException('Cannot remove the title field');
    }
    await this.prisma.intakeFormField.delete({ where: { id: fieldId } });
    return { ok: true };
  }

  async previewPublic(token: string) {
    const form = await this.prisma.intakeForm.findUnique({
      where: { token },
      include: {
        fields: { orderBy: { position: 'asc' } },
        project: { select: { id: true, name: true, archivedAt: true } },
        workspace: { select: { id: true, name: true } },
      },
    });
    if (!form || !form.isActive || form.project.archivedAt) {
      throw new NotFoundException('Form not available');
    }
    return {
      name: form.name,
      description: form.description,
      workspaceName: form.workspace.name,
      projectName: form.project.name,
      fields: form.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options,
      })),
    };
  }

  async submitPublic(token: string, dto: SubmitIntakeFormDto) {
    const form = await this.prisma.intakeForm.findUnique({
      where: { token },
      include: {
        fields: { orderBy: { position: 'asc' } },
        project: { select: { id: true, workspaceId: true, archivedAt: true } },
      },
    });
    if (!form || !form.isActive || form.project.archivedAt) {
      throw new NotFoundException('Form not available');
    }

    const answers = dto.answers ?? {};
    let title = '';
    let description: string | undefined;

    for (const field of form.fields) {
      const raw = answers[field.key];
      const empty =
        raw === undefined ||
        raw === null ||
        (typeof raw === 'string' && !raw.trim());

      if (field.required && empty) {
        throw new BadRequestException(`${field.label} is required`);
      }

      if (field.type === IntakeFormFieldType.TITLE) {
        title = String(raw ?? '').trim();
      }
      if (field.type === IntakeFormFieldType.DESCRIPTION && !empty) {
        description = String(raw).trim();
      }
      if (
        field.type === IntakeFormFieldType.SINGLE_SELECT &&
        !empty &&
        Array.isArray(field.options) &&
        !field.options.includes(String(raw))
      ) {
        throw new BadRequestException(`Invalid option for ${field.label}`);
      }
    }

    if (!title) {
      title =
        form.titleTemplate?.trim() ||
        `Intake: ${form.name} (${new Date().toISOString().slice(0, 10)})`;
    }

    const task = await this.tasks.create(
      form.workspaceId,
      form.projectId,
      form.createdById,
      {
        title,
        description,
        status: form.defaultStatus,
        assigneeId: form.defaultAssigneeId,
      },
      { skipAutomations: true },
    );

    const createdId = task.id;
    for (const field of form.fields) {
      if (!field.customFieldId) continue;
      const raw = answers[field.key];
      if (raw === undefined || raw === null || raw === '') continue;

      const valueDto =
        field.type === IntakeFormFieldType.NUMBER
          ? { numberValue: Number(raw) }
          : field.type === IntakeFormFieldType.DATE
            ? { dateValue: String(raw) }
            : { textValue: String(raw) };

      await this.customFields.upsertValue(
        form.workspaceId,
        createdId,
        field.customFieldId,
        form.createdById,
        valueDto,
      );
    }

    await this.automations.evaluate({
      workspaceId: form.workspaceId,
      projectId: form.projectId,
      taskId: createdId,
      taskTitle: title,
      trigger: AutomationTrigger.TASK_CREATED,
      actorId: form.createdById,
    });

    return {
      ok: true,
      taskId: createdId,
      title,
      message: 'Submitted successfully',
    };
  }

  private withShareUrl<T extends { token: string }>(form: T) {
    const webOrigin =
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173';
    return {
      ...form,
      shareUrl: `${webOrigin}/f/${form.token}`,
    };
  }

  private async getRaw(workspaceId: string, formId: string) {
    const form = await this.prisma.intakeForm.findFirst({
      where: { id: formId, workspaceId },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  private async getField(
    workspaceId: string,
    formId: string,
    fieldId: string,
  ) {
    await this.getRaw(workspaceId, formId);
    const field = await this.prisma.intakeFormField.findFirst({
      where: { id: fieldId, formId },
    });
    if (!field) throw new NotFoundException('Field not found');
    return field;
  }

  private async assertProject(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, archivedAt: null },
    });
    if (!project) throw new BadRequestException('Project not found');
  }

  private async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new BadRequestException('Assignee must be a workspace member');
    }
  }

  private async assertCustomField(workspaceId: string, fieldId: string) {
    const field = await this.prisma.customFieldDefinition.findFirst({
      where: { id: fieldId, workspaceId },
    });
    if (!field) throw new BadRequestException('Custom field not found');
  }
}
