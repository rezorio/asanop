import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsEnum(CustomFieldType)
  type!: CustomFieldType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  options?: string[];
}

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  options?: string[];
}

export class UpsertFieldValueDto {
  @ValidateIf((o: UpsertFieldValueDto) => o.textValue !== undefined)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  textValue?: string | null;

  @ValidateIf((o: UpsertFieldValueDto) => o.numberValue !== undefined)
  @IsOptional()
  @IsNumber()
  numberValue?: number | null;

  @ValidateIf((o: UpsertFieldValueDto) => o.dateValue !== undefined)
  @IsOptional()
  @IsDateString()
  dateValue?: string | null;
}
