import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock the auth service first
jest.mock('../../../src/features/auth/auth.service.ts', () => ({
  authService: {
    getGoogleAuthUrl: jest.fn(),
    handleGoogleCallback: jest.fn(),
    handleNextjsSignin: jest.fn(),
    logoutUser: jest.fn(),
    getMe: jest.fn(),
    createAdmin: jest.fn(),
    getAdminUsers: jest.fn(),
  }
}));

// Import after mocking
import { authControllers } from '../../../src/features/auth/auth.controller.ts';
import { authService } from '../../../src/features/auth/auth.service.ts';

// Get the mocked service for easier access
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Controllers', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      query: {},
      body: {},
      user: { userId: 'user-123', email: 'test@example.com', plan: 'TRIAL', role: 'USER' },
      log: {
        error: jest.fn(),
      },
      server: {
        jwt: {
          sign: jest.fn().mockReturnValue('mock-jwt-token'),
        },
      },
    } as any;

    // Setup mock reply
    mockReply = {
      redirect: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setCookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('googleRedirect', () => {
    it('should redirect to Google OAuth URL', async () => {
      const mockAuthUrl = 'https://accounts.google.com/oauth/authorize?client_id=test';
      mockAuthService.getGoogleAuthUrl.mockReturnValue(mockAuthUrl);

      const result = await authControllers.googleRedirect(
        mockRequest,
        mockReply
      );

      expect(mockAuthService.getGoogleAuthUrl).toHaveBeenCalled();
      expect(mockReply.redirect).toHaveBeenCalledWith(mockAuthUrl);
    });
  });

  describe('googleCallback', () => {
    it('should handle successful Google callback', async () => {
      const mockUser = {
        id: '123',
        status: true,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: new Date('2024-01-01T00:00:00Z'),
        image: 'https://example.com/avatar.jpg',
        phone: '(11) 99999-9999',
        stripe_customer_id: null,
        plan: 'FREE' as any,
        role: 'USER' as any,
        timezone: 'America/Sao_Paulo',
        language: 'pt',
        subscriptionId: null,
        refreshToken: null,
        lastActive: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockRequest.query = { code: 'google-auth-code' };
      mockAuthService.handleGoogleCallback.mockResolvedValue(mockUser);

      const result = await authControllers.googleCallback(
        mockRequest,
        mockReply
      );

      expect(mockAuthService.handleGoogleCallback).toHaveBeenCalledWith('google-auth-code');
      expect(mockRequest.server!.jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          plan: mockUser.plan,
          role: mockUser.role,
        }),
        { expiresIn: '7d' }
      );
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'auth-token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV is not production in tests
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          plan: mockUser.plan,
          role: mockUser.role,
          image: mockUser.image,
        },
        token: 'mock-jwt-token',
      });
    });

    it('should handle service errors', async () => {
      mockRequest.query = { code: 'invalid-code' };
      mockAuthService.handleGoogleCallback.mockRejectedValue(new Error('Invalid code'));

      await expect(
        authControllers.googleCallback(mockRequest, mockReply)
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('nextjsSignin', () => {
    it('should handle successful NextJS signin', async () => {
      const mockUser = {
        id: '123',
        status: true,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: new Date('2024-01-01T00:00:00Z'),
        image: 'https://example.com/avatar.jpg',
        phone: '(11) 99999-9999',
        stripe_customer_id: null,
        plan: 'FREE' as any,
        role: 'USER' as any,
        timezone: 'America/Sao_Paulo',
        language: 'pt',
        subscriptionId: null,
        refreshToken: null,
        lastActive: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockRequest.body = {
        email: 'john@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
        googleId: 'google-123',
        verified: true,
      };

      mockAuthService.handleNextjsSignin.mockResolvedValue(mockUser);

      const result = await authControllers.nextjsSignin(
        mockRequest,
        mockReply
      );

      expect(mockAuthService.handleNextjsSignin).toHaveBeenCalledWith(
        'john@example.com',
        'John Doe',
        'https://example.com/avatar.jpg',
        true
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          plan: mockUser.plan,
          role: mockUser.role,
          image: mockUser.image,
        }
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        email: 'john@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
        googleId: 'google-123',
        verified: true,
      };

      mockAuthService.handleNextjsSignin.mockRejectedValue(new Error('Database error'));

      // CORRIGIDO: O controller retorna 500, não 400
      await expect(
        authControllers.nextjsSignin(mockRequest, mockReply)
      ).rejects.toThrow('Database error');
    });
  });

  describe('logout', () => {
    it('should handle successful logout', async () => {
      mockAuthService.logoutUser.mockResolvedValue(undefined);

      const result = await authControllers.logout(
        mockRequest,
        mockReply
      );

      expect(mockReply.clearCookie).toHaveBeenCalledWith('auth-token');
      expect(mockAuthService.logoutUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout errors', async () => {
      mockAuthService.logoutUser.mockRejectedValue(new Error('Logout failed'));

      await expect(
        authControllers.logout(mockRequest, mockReply)
      ).rejects.toThrow('Logout failed');
    });
  });

  describe('getMe', () => {
    it('should return user info successfully', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        plan: 'FREE' as any,
        role: 'USER' as any,
        timezone: 'America/Sao_Paulo',
        language: 'pt',
        lastActive: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        interpretationQuota: null,
      };

      mockAuthService.getMe.mockResolvedValue(mockUser);

      const result = await authControllers.getMe(
        mockRequest,
        mockReply
      );

      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ user: mockUser });
    });

    it('should handle user not found', async () => {
      mockAuthService.getMe.mockResolvedValue(null);

      await expect(
        authControllers.getMe(mockRequest, mockReply)
      ).rejects.toThrow('User not found');
    });
  });

  describe('createAdmin', () => {
    it('should create admin successfully', async () => {
      const mockUser = {
        id: 'admin-123',
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '(11) 99988-7766',
        plan: 'PREMIUM' as const,
        role: 'ADMIN' as const,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        status: true,
        password: 'hashedPassword123',
        emailVerified: new Date('2024-01-01T00:00:00Z'),
        image: null,
        stripe_customer_id: null,
        subscriptionId: null,
        refreshToken: null,
        lastActive: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockRequest.body = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '(11) 99988-7766',
        password: 'SecurePass123!',
        adminSecret: 'validadminsecret123',
      };

      mockAuthService.createAdmin.mockResolvedValue(mockUser);

      const result = await authControllers.createAdmin(
        mockRequest,
        mockReply
      );

      expect(mockAuthService.createAdmin).toHaveBeenCalledWith(
        'validadminsecret123',
        'admin@example.com',
        'SecurePass123!',
        'Admin User',
        '(11) 99988-7766'
      );
      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Admin created successfully',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          plan: mockUser.plan,
          role: mockUser.role,
          language: mockUser.language,
          timezone: mockUser.timezone,
          status: mockUser.status,
          createdAt: mockUser.createdAt.toISOString(),
          updatedAt: mockUser.updatedAt.toISOString(),
        }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.body = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '(11) 99988-7766',
        password: 'SecurePass123!',
        adminSecret: 'invalidsecret',
      };

      mockAuthService.createAdmin.mockRejectedValue(new Error('Unauthorized'));

      await expect(authControllers.createAdmin(
        mockRequest,
        mockReply
      )).rejects.toThrow('Unauthorized');
    });

    it('should handle user already exists', async () => {
      mockRequest.body = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '(11) 99988-7766',
        password: 'SecurePass123!',
        adminSecret: 'validadminsecret123',
      };

      mockAuthService.createAdmin.mockRejectedValue(new Error('User already exists'));

      await expect(authControllers.createAdmin(
        mockRequest,
        mockReply
      )).rejects.toThrow('User already exists');
    });

    it('should handle generic errors', async () => {
      mockRequest.body = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '(11) 99988-7766',
        password: 'SecurePass123!',
        adminSecret: 'validadminsecret123',
      };

      mockAuthService.createAdmin.mockRejectedValue(new Error('Database connection failed'));

      await expect(authControllers.createAdmin(
        mockRequest,
        mockReply
      )).rejects.toThrow('Database connection failed');
    });
  });

  describe('getAdmin', () => {
    it('should return admin users successfully', async () => {
      const mockAdminUsers = [
        {
          id: '1',
          status: true,
          name: 'Admin 1',
          email: 'admin1@example.com',
          password: 'hashedpassword',
          emailVerified: new Date('2024-01-01T00:00:00Z'),
          image: null,
          phone: '(11) 99999-9999',
          stripe_customer_id: null,
          plan: 'PREMIUM' as any,
          role: 'ADMIN' as any,
          timezone: 'America/Sao_Paulo',
          language: 'pt',
          subscriptionId: null,
          refreshToken: null,
          lastActive: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: '2',
          status: true,
          name: 'Admin 2',
          email: 'admin2@example.com',
          password: 'hashedpassword',
          emailVerified: new Date('2024-01-01T00:00:00Z'),
          image: null,
          phone: '(11) 99999-9999',
          stripe_customer_id: null,
          plan: 'PREMIUM' as any,
          role: 'ADMIN' as any,
          timezone: 'America/Sao_Paulo',
          language: 'pt',
          subscriptionId: null,
          refreshToken: null,
          lastActive: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      mockAuthService.getAdminUsers.mockResolvedValue(mockAdminUsers);

      const result = await authControllers.getAdmin(
        mockRequest,
        mockReply
      );

      expect(mockAuthService.getAdminUsers).toHaveBeenCalled();
      expect(result).toEqual({ usersAdmin: mockAdminUsers });
    });

    it('should handle service errors', async () => {
      mockAuthService.getAdminUsers.mockRejectedValue(new Error('Database error'));

      await expect(
        authControllers.getAdmin(mockRequest, mockReply)
      ).rejects.toThrow('User not found');
    });
  });
});