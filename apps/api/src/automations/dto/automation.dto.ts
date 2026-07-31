import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  AutomationAction,
  AutomationTrigger,
  TaskStatus,
} from '@prisma/client';

export class CreateAutomationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEnum(AutomationTrigger)
  trigger!: AutomationTrigger;

  @IsOptional()
  @IsEnum(TaskStatus)
  triggerFromStatus?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskStatus)
  triggerToStatus?: TaskStatus;

  @IsEnum(AutomationAction)
  action!: AutomationAction;

  @ValidateIf((o: CreateAutomationDto) => o.action === AutomationAction.SET_STATUS)
  @IsEnum(TaskStatus)
  actionStatus?: TaskStatus;

  @ValidateIf((o: CreateAutomationDto) => o.action === AutomationAction.SET_ASSIGNEE)
  @IsString()
  actionAssigneeId?: string;

  @ValidateIf((o: CreateAutomationDto) => o.action === AutomationAction.ADD_COMMENT)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  actionComment?: string;

  @IsOptional()
  @IsString()
  projectId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutomationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(AutomationTrigger)
  trigger?: AutomationTrigger;

  @IsOptional()
  @IsEnum(TaskStatus)
  triggerFromStatus?: TaskStatus | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  triggerToStatus?: TaskStatus | null;

  @IsOptional()
  @IsEnum(AutomationAction)
  action?: AutomationAction;

  @IsOptional()
  @IsEnum(TaskStatus)
  actionStatus?: TaskStatus | null;

  @IsOptional()
  @IsString()
  actionAssigneeId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actionComment?: string | null;

  @IsOptional()
  @IsString()
  projectId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
