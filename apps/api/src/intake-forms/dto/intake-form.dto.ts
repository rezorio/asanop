import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IntakeFormFieldType, TaskStatus } from '@prisma/client';

export class CreateIntakeFormDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  defaultAssigneeId?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  defaultStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleTemplate?: string;
}

export class UpdateIntakeFormDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  defaultAssigneeId?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  defaultStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleTemplate?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateIntakeFormFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsEnum(IntakeFormFieldType)
  type!: IntakeFormFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  customFieldId?: string | null;

  @IsOptional()
  position?: number;
}

export class UpdateIntakeFormFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  customFieldId?: string | null;

  @IsOptional()
  position?: number;
}

export class SubmitIntakeFormDto {
  @IsObject()
  answers!: Record<string, string | number | null>;
}
