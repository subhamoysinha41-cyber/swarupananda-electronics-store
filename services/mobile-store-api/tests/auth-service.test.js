import { describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/services/auth-service.js';

const TEST_SECRET = 'test-only-secret-never-used-outside-tests-123456';

function createAuthService({ now = Date.now, expiry = '15m' } = {}) {
  const users = [];
  const User = {
    findOne: jest.fn((query) => ({
      lean: async () => users.find((user) =>
        user.phone === query.phone || user.email === query.email
        || query.$or?.some((condition) =>
          (condition.phone && condition.phone === user.phone)
          || (condition.email && condition.email === user.email),
        ),
      ) || null,
      select: async () => users.find((user) => user.phone === query.phone) || null,
    })),
    create: jest.fn(async (input) => {
      const user = { ...input, _id: '507f1f77bcf86cd799439011', createdAt: new Date(now()) };
      users.push(user);
      return user;
    }),
    findById: jest.fn((id) => ({
      lean: async () => users.find((user) => String(user._id) === id) || null,
    })),
  };
  const service = new AuthService({
    User,
    config: {
      jwtSecret: TEST_SECRET,
      jwtIssuer: 'mobile-store-api',
      jwtAudience: 'mobile-store-web',
      jwtExpiresIn: expiry,
    },
    clock: now,
  });
  return { service, User, users };
}

describe('AuthService', () => {
  it('stores a bcrypt hash, issues a constrained JWT, and returns a sanitized user', async () => {
    const { service, users } = createAuthService();

    const result = await service.register({
      name: 'Asha Rao',
      phone: '+919876543210',
      email: 'asha@example.com',
      password: 'StrongPass123!',
      role: 'admin',
    });

    expect(users[0].passwordHash).not.toBe('StrongPass123!');
    expect(users[0].passwordHash).toMatch(/^\$2[aby]\$/);
    expect(users[0].role).toBe('customer');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.role).toBe('customer');
    expect(jwt.verify(result.token, TEST_SECRET, {
      algorithms: ['HS256'],
      issuer: 'mobile-store-api',
      audience: 'mobile-store-web',
    })).toMatchObject({ sub: '507f1f77bcf86cd799439011', role: 'customer' });
  });

  it('rejects incorrect passwords and expired tokens', async () => {
    let now = Date.now();
    const { service } = createAuthService({ now: () => now, expiry: '1s' });
    const result = await service.register({
      name: 'Asha Rao',
      phone: '+919876543210',
      email: 'asha@example.com',
      password: 'StrongPass123!',
    });

    await expect(service.login({ phone: '+919876543210', password: 'incorrect' }))
      .rejects.toMatchObject({ status: 401 });
    now += 2000;
    await expect(service.authenticate(result.token)).rejects.toMatchObject({ status: 401 });
  });
});
