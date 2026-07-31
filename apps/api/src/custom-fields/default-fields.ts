import { CustomFieldType, Prisma } from '@prisma/client';

export const DEFAULT_CUSTOM_FIELDS: Array<{
  name: string;
  type: CustomFieldType;
  options?: string[];
  position: number;
}> = [
  {
    name: 'Effort Points',
    type: CustomFieldType.NUMBER,
    position: 0,
  },
  {
    name: 'Stage',
    type: CustomFieldType.SINGLE_SELECT,
    options: ['Backlog', 'Ready', 'In Progress', 'Review', 'Blocked', 'Done'],
    position: 1,
  },
  {
    name: 'Approval Status',
    type: CustomFieldType.SINGLE_SELECT,
    options: ['Not needed', 'Pending', 'Approved', 'Rejected'],
    position: 2,
  },
  {
    name: 'Area',
    type: CustomFieldType.SINGLE_SELECT,
    options: ['API', 'Web', 'Design', 'QA', 'Infra', 'Mobile'],
    position: 3,
  },
  {
    name: 'Target Release',
    type: CustomFieldType.SINGLE_SELECT,
    options: ['M1', 'M2', 'M3', 'M4', 'M5'],
    position: 4,
  },
];

export function defaultCustomFieldCreateMany(
  workspaceId: string,
): Prisma.CustomFieldDefinitionCreateManyInput[] {
  return DEFAULT_CUSTOM_FIELDS.map((field) => ({
    workspaceId,
    name: field.name,
    type: field.type,
    options: field.options ?? undefined,
    position: field.position,
  }));
}
