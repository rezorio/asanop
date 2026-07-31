import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IntakeFormsService } from './intake-forms.service';
import {
  CreateIntakeFormDto,
  CreateIntakeFormFieldDto,
  UpdateIntakeFormDto,
  UpdateIntakeFormFieldDto,
} from './dto/intake-form.dto';
import {
  CurrentUser,
  RequirePermissions,
  type AuthUser,
} from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/forms')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class IntakeFormsController {
  constructor(private readonly intakeFormsService: IntakeFormsService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string) {
    return this.intakeFormsService.list(workspaceId);
  }

  @Get(':formId')
  getOne(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
  ) {
    return this.intakeFormsService.getOne(workspaceId, formId);
  }

  @Post()
  @RequirePermissions('intake_forms.manage')
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateIntakeFormDto,
  ) {
    return this.intakeFormsService.create(workspaceId, user.id, dto);
  }

  @Patch(':formId')
  @RequirePermissions('intake_forms.manage')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Body() dto: UpdateIntakeFormDto,
  ) {
    return this.intakeFormsService.update(workspaceId, formId, dto);
  }

  @Delete(':formId')
  @RequirePermissions('intake_forms.manage')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
  ) {
    return this.intakeFormsService.remove(workspaceId, formId);
  }

  @Post(':formId/fields')
  @RequirePermissions('intake_forms.manage')
  addField(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Body() dto: CreateIntakeFormFieldDto,
  ) {
    return this.intakeFormsService.addField(workspaceId, formId, dto);
  }

  @Patch(':formId/fields/:fieldId')
  @RequirePermissions('intake_forms.manage')
  updateField(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateIntakeFormFieldDto,
  ) {
    return this.intakeFormsService.updateField(
      workspaceId,
      formId,
      fieldId,
      dto,
    );
  }

  @Delete(':formId/fields/:fieldId')
  @RequirePermissions('intake_forms.manage')
  removeField(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.intakeFormsService.removeField(workspaceId, formId, fieldId);
  }
}
