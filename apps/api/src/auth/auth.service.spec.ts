import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userFindUnique = jest.fn();
  const prisma = {
    user: { findUnique: userFindUnique },
  };
  const jwt = { sign: jest.fn(() => 'signed-token') };
  const service = new AuthService(prisma as never, jwt as never);

  beforeEach(() => jest.clearAllMocks());

  it('normalizes an email and returns a signed session for valid credentials', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Maya',
      email: 'maya@example.test',
      passwordHash: await bcrypt.hash('password123', 4),
    });

    await expect(
      service.login({ email: '  MAYA@EXAMPLE.TEST ', password: 'password123' }),
    ).resolves.toEqual({
      accessToken: 'signed-token',
      user: { id: 'user-1', name: 'Maya', email: 'maya@example.test' },
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: 'maya@example.test' },
    });
  });

  it('does not reveal whether an account exists', async () => {
    userFindUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@example.test', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a duplicate registration before creating workspace data', async () => {
    userFindUnique.mockResolvedValue({ id: 'existing-user' });
    await expect(
      service.register({ name: 'Existing', email: 'EXISTING@example.test', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
