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
import { CustomFieldsService } from './custom-fields.service';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
} from './dto/custom-field.dto';
import { RequirePermissions } from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/custom-fields')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string) {
    return this.customFieldsService.list(workspaceId);
  }

  @Post()
  @RequirePermissions('custom_fields.manage')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.customFieldsService.create(workspaceId, dto);
  }

  @Patch(':fieldId')
  @RequirePermissions('custom_fields.manage')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.customFieldsService.update(workspaceId, fieldId, dto);
  }

  @Delete(':fieldId')
  @RequirePermissions('custom_fields.manage')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.customFieldsService.remove(workspaceId, fieldId);
  }
}
