import { ForbiddenException } from '@nestjs/common';
import {
  ALL_PERMISSIONS,
  assertPermission,
  hasPermission,
  isPermission,
  slugifyRoleKey,
  SYSTEM_ROLE_DEFINITIONS,
  SYSTEM_ROLE_KEYS,
} from './permissions';

describe('workspace permissions', () => {
  it('requires every requested permission', () => {
    expect(hasPermission(['tasks.create', 'tasks.edit_any'], 'tasks.create')).toBe(true);
    expect(
      hasPermission(['tasks.create'], ['tasks.create', 'tasks.edit_any']),
    ).toBe(false);
  });

  it('rejects missing access with a consistent forbidden error', () => {
    expect(() => assertPermission([], 'workspace.manage')).toThrow(
      ForbiddenException,
    );
  });

  it('keeps the project manager role authoritative', () => {
    const manager = SYSTEM_ROLE_DEFINITIONS.find(
      (role) => role.key === SYSTEM_ROLE_KEYS.PROJECT_MANAGER,
    );
    expect(manager?.permissions).toEqual(ALL_PERMISSIONS);
  });

  it('normalizes safe custom role keys', () => {
    expect(slugifyRoleKey('  Client Success / Lead  ')).toBe(
      'client_success_lead',
    );
    expect(slugifyRoleKey('***')).toBe('custom_role');
    expect(isPermission('tasks.delete')).toBe(true);
    expect(isPermission('tasks.destroy')).toBe(false);
  });
});
