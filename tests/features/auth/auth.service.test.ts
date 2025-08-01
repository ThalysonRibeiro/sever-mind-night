import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock prisma antes de qualquer import
const mockPrisma = {
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
  },
  userSettings: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  userStats: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  interpretationQuota: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  auditLog: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  $transaction: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('../../../src/lib/prisma.ts', () => ({
  prisma: mockPrisma
}));

// Tipagem correta para o mock da transação baseada no Prisma real
type TransactionMock = {
  user: {
    create: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
  };
  userSettings: {
    create: jest.MockedFunction<any>;
  };
  userStats: {
    create: jest.MockedFunction<any>;
  };
  interpretationQuota: {
    create: jest.MockedFunction<any>;
  };
  auditLog: {
    create: jest.MockedFunction<any>;
  };
};

const createTransactionMock = (): TransactionMock => ({
  user: {
    create: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
  userSettings: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  userStats: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  interpretationQuota: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  auditLog: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
});

jest.mock('../../../src/lib/google-auth.ts', () => ({
  getGoogleAuthUrl: jest.fn(),
  getGoogleUserInfo: jest.fn(),
}));

jest.mock('date-fns', () => ({
  addWeeks: jest.fn((date: Date, weeks: number) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000))
}));

jest.mock('../../../src/utils/constants.ts', () => ({
  PLANS_INTERPRETATION_QUOTA: {
    TRIAL: { dailyCredits: 5, weeklyCredits: 20 },
    PREMIUM: { dailyCredits: 50, weeklyCredits: 200 }
  }
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import * as googleAuth from '../../../src/lib/google-auth.ts';
import { isValidEmail } from '../../../src/utils/emailValidation.ts';
import * as bcrypt from 'bcrypt';
import { authService } from '../../../src/features/auth/auth.service.ts';

jest.mock('../../../src/utils/emailValidation.ts');

const mockGoogleAuth = googleAuth as jest.Mocked<typeof googleAuth>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Definir os tipos para evitar erro 7022
type UserMock = {
  id: string;
  status: boolean;
  name: string;
  email: string;
  password: string | null;
  emailVerified: Date;
  image: string;
  phone: string | null;
  stripe_customer_id: string | null;
  plan: any;
  role: any;
  timezone: string;
  language: string;
  subscriptionId: string | null;
  refreshToken: string | null;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  // Adicionando interpretationQuota como propriedade opcional
  interpretationQuota?: {
    dailyCredits: number;
    weeklyCredits: number;
    nextResetDate: Date;
  };
};

const createUserMock = (overrides: Partial<UserMock> = {}): UserMock => ({
  id: 'user-123',
  status: true,
  name: 'Test User',
  email: 'test@example.com',
  password: null,
  emailVerified: new Date('2024-01-01T00:00:00Z'),
  image: 'https://example.com/avatar.jpg',
  phone: null,
  stripe_customer_id: null,
  plan: 'TRIAL',
  role: 'USER',
  timezone: 'America/Sao_Paulo',
  language: 'pt',
  subscriptionId: null,
  refreshToken: null,
  lastActive: new Date('2024-01-01T00:00:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
});

type AuditLogMock = {
  id: string;
  createdAt: Date;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues: any | null;
  newValues: any | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const createAuditLogMock = (overrides: Partial<AuditLogMock> = {}): AuditLogMock => ({
  id: 'audit-123',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  userId: 'user-123',
  action: 'user_login',
  entity: 'user',
  entityId: 'user-123',
  oldValues: null,
  newValues: null,
  ipAddress: null,
  userAgent: null,
  ...overrides
});


describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.ADMIN_SECRET = 'test-admin-secret';

    // Configurar o mock do $transaction para funcionar corretamente
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        const mockTx = createTransactionMock();
        return await callback(mockTx);
      }
      return callback;
    });
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET;
  });

  describe('getGoogleAuthUrl', () => {
    it('should return Google auth URL', () => {
      const mockUrl = 'https://accounts.google.com/oauth/authorize?client_id=test';
      mockGoogleAuth.getGoogleAuthUrl.mockReturnValue(mockUrl);

      const result = authService.getGoogleAuthUrl();

      expect(mockGoogleAuth.getGoogleAuthUrl).toHaveBeenCalled();
      expect(result).toBe(mockUrl);
    });
  });

  describe('handleGoogleCallback', () => {
    const mockGoogleUser = {
      id: 'google-user-123',
      email: 'john@example.com',
      name: 'John Doe',
      picture: 'https://example.com/avatar.jpg',
      verified: true,
    };

    it('should create new user if not exists', async () => {
      const mockCreatedUser = createUserMock({
        email: 'john@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
        plan: 'TRIAL',
        role: 'USER',
      });

      mockGoogleAuth.getGoogleUserInfo.mockResolvedValue(mockGoogleUser);
      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        if (typeof callback === 'function') {
          const mockTx = createTransactionMock();
          (mockTx.user.create as jest.MockedFunction<any>).mockResolvedValue(mockCreatedUser);
          return await callback(mockTx);
        }
        return callback;
      });

      const result = await authService.handleGoogleCallback('auth-code');

      expect(mockGoogleAuth.getGoogleUserInfo).toHaveBeenCalledWith('auth-code');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should update existing user and log activity', async () => {
      const mockExistingUser = createUserMock({
        email: 'john@example.com',
        name: 'John Doe',
        plan: 'TRIAL',
        role: 'USER',
      });

      mockGoogleAuth.getGoogleUserInfo.mockResolvedValue(mockGoogleUser);
      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockExistingUser);
      (mockPrisma.user.update as jest.MockedFunction<any>).mockResolvedValue(mockExistingUser);
      (mockPrisma.auditLog.create as jest.MockedFunction<any>).mockResolvedValue(createAuditLogMock());

      const result = await authService.handleGoogleCallback('auth-code');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: { lastActive: expect.any(Date) }
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockExistingUser.id,
          action: 'user_login',
          entity: 'user',
          entityId: mockExistingUser.id,
        }
      });
      expect(result).toEqual(mockExistingUser);
    });

    it('should handle Google auth errors', async () => {
      mockGoogleAuth.getGoogleUserInfo.mockRejectedValue(new Error('Invalid code'));

      await expect(authService.handleGoogleCallback('invalid-code')).rejects.toThrow('Invalid code');
    });
  });

  describe('handleNextjsSignin', () => {
    it('should create new user if not exists', async () => {
      const mockCreatedUser = createUserMock({
        email: 'john@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
        plan: 'TRIAL',
        role: 'USER',
      });

      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        if (typeof callback === 'function') {
          const mockTx = createTransactionMock();
          (mockTx.user.create as jest.MockedFunction<any>).mockResolvedValue(mockCreatedUser);
          return await callback(mockTx);
        }
        return callback;
      });

      const result = await authService.handleNextjsSignin(
        'john@example.com',
        'John Doe',
        'https://example.com/avatar.jpg',
        true
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should update existing user', async () => {
      const mockExistingUser = createUserMock({
        email: 'john@example.com',
        name: 'John Doe',
        plan: 'TRIAL',
        role: 'USER',
      });

      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockExistingUser);
      (mockPrisma.user.update as jest.MockedFunction<any>).mockResolvedValue(mockExistingUser);
      (mockPrisma.auditLog.create as jest.MockedFunction<any>).mockResolvedValue(createAuditLogMock());

      const result = await authService.handleNextjsSignin(
        'john@example.com',
        'John Doe',
        'https://example.com/avatar.jpg',
        true
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: {
          lastActive: expect.any(Date),
          image: 'https://example.com/avatar.jpg',
        }
      });
      expect(result).toEqual(mockExistingUser);
    });
  });

  describe('logoutUser', () => {
    it('should create audit log for logout', async () => {
      (mockPrisma.auditLog.create as jest.MockedFunction<any>).mockResolvedValue(createAuditLogMock());

      await authService.logoutUser('user-123');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'user_logout',
          entity: 'user',
          entityId: 'user-123',
        }
      });
    });

    it('should handle undefined userId', async () => {
      await authService.logoutUser(undefined);

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user with interpretation quota', async () => {
      const mockUser = createUserMock({
        name: 'John Doe',
        email: 'john@example.com',
        plan: 'TRIAL',
        role: 'USER',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        lastActive: new Date(),
        createdAt: new Date(),
        interpretationQuota: {
          dailyCredits: 5,
          weeklyCredits: 20,
          nextResetDate: new Date(),
        }
      });

      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      const result = await authService.getMe('user-123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plan: true,
          role: true,
          timezone: true,
          language: true,
          lastActive: true,
          createdAt: true,
          interpretationQuota: {
            select: {
              dailyCredits: true,
              weeklyCredits: true,
              nextResetDate: true,
            }
          }
        }
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await authService.getMe('non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('createAdmin', () => {
    it('should create admin successfully', async () => {
      const mockCreatedAdmin = createUserMock({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '11999887766',
        role: 'ADMIN',
        plan: 'PREMIUM',
        lastActive: new Date(),
      });

      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);
      (mockPrisma.user.create as jest.MockedFunction<any>).mockResolvedValue(mockCreatedAdmin);
      (mockPrisma.userSettings.create as jest.MockedFunction<any>).mockResolvedValue({});
      (mockPrisma.userStats.create as jest.MockedFunction<any>).mockResolvedValue({});
      (mockPrisma.interpretationQuota.create as jest.MockedFunction<any>).mockResolvedValue({});
      (mockPrisma.auditLog.create as jest.MockedFunction<any>).mockResolvedValue({});
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      (isValidEmail as jest.Mock).mockReturnValue(true);

      const result = await authService.createAdmin(
        'test-admin-secret',
        'admin@example.com',
        'SecurePass123!',
        'Admin User',
        '11999887766'
      );

      expect(mockBcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' }
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'hashed-password',
          phone: '11999887766',
          role: 'ADMIN',
          plan: 'PREMIUM',
          lastActive: expect.any(Date),
        }
      });
      expect(result).toEqual(mockCreatedAdmin);
    });

    it('should throw error for invalid admin secret', async () => {
      await expect(
        authService.createAdmin(
          'invalid-secret',
          'admin@example.com',
          'SecurePass123!',
          'Admin User',
          '11999887766'
        )
      ).rejects.toThrow('Invalid or missing admin secret');
    });

    it('should throw error if user already exists', async () => {
      const mockExistingUser = createUserMock({
        id: 'user-123',
        email: 'admin@example.com',
      });

      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockExistingUser);

      await expect(
        authService.createAdmin(
          'test-admin-secret',
          'admin@example.com',
          'SecurePass123!',
          'Admin User',
          '11999887766'
        )
      ).rejects.toThrow('User with email admin@example.com already exists');
    });

    it('should throw error for invalid email format', async () => {
      (mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);
      (isValidEmail as jest.Mock).mockReturnValue(false);

      await expect(
        authService.createAdmin(
          'test-admin-secret',
          'invalid-email',
          'SecurePass123!',
          'Admin User',
          '11999887766'
        )
      ).rejects.toThrow('Invalid email format');
    });

    it('should handle missing admin secret environment variable', async () => {
      delete process.env.ADMIN_SECRET;

      await expect(
        authService.createAdmin(
          'any-secret',
          'admin@example.com',
          'SecurePass123!',
          'Admin User',
          '11999887766'
        )
      ).rejects.toThrow('Invalid or missing admin secret');
    });
  });

  describe('getAdminUsers', () => {
    it('should return all admin users', async () => {
      const mockAdminUsers = [
        createUserMock({ id: 'admin-1', name: 'Admin One', email: 'admin1@example.com', role: 'ADMIN' }),
        createUserMock({ id: 'admin-2', name: 'Admin Two', email: 'admin2@example.com', role: 'ADMIN' }),
      ];

      (mockPrisma.user.findMany as jest.MockedFunction<any>).mockResolvedValue(mockAdminUsers);

      const result = await authService.getAdminUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'ADMIN' }
      });
      expect(result).toEqual(mockAdminUsers);
    });

    it('should return empty array if no admin users found', async () => {
      (mockPrisma.user.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      const result = await authService.getAdminUsers();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      (mockPrisma.user.findMany as jest.MockedFunction<any>).mockRejectedValue(new Error('Database connection failed'));

      await expect(authService.getAdminUsers()).rejects.toThrow('Database connection failed');
    });
  });
});