
import { describe, it, expect, jest } from '@jest/globals';
import {
  phoneRegex,
  passwordSchema,
  createAdminSchema,
  publicUserSchema,
  createAdminResponseSchema
} from '../../../src/features/auth/auth.types.ts';

// Mock the email validation utility
jest.mock('../../../src/utils/emailValidation.ts', () => ({
  isValidEmail: jest.fn()
}));

// Import the mocked function
import { isValidEmail } from '../../../src/utils/emailValidation.ts';
const mockIsValidEmail = isValidEmail as jest.MockedFunction<typeof isValidEmail>;

describe('Auth Types', () => {
  beforeEach(() => {
    // Configurar o mock antes de cada teste
    mockIsValidEmail.mockImplementation((email: unknown) => {
      if (typeof email !== 'string') return false;
      const blockedDomains = ['example.com', 'test.com', 'blocked.com'];
      const domain = email.split('@')[1];
      if (!domain) return false;
      return !blockedDomains.includes(domain);
    });
  });
  describe('phoneRegex', () => {
    it('should match valid Brazilian phone numbers', () => {
      const validPhones = [
        '11999887766',
        '(11)99988-7766',
        '11 99988-7766',
        '(11) 99988-7766',
        '1199887766',
        '(11)9988-7766',
        '11 9988-7766'
      ];

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        '11999',
        'abc123456789',
        '11-999-888-7766-123',
        '999887766', // missing area code
        '1199988776612345' // too long
      ];

      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(false);
      });
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'MySecure@Pass1',
        'Complex#Pass99',
        'StrongP@ssw0rd'
      ];

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject passwords without uppercase letters', () => {
      const result = passwordSchema.safeParse('password123!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letra maiúscula');
      }
    });

    it('should reject passwords without lowercase letters', () => {
      const result = passwordSchema.safeParse('PASSWORD123!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letra minúscula');
      }
    });

    it('should reject passwords without numbers', () => {
      const result = passwordSchema.safeParse('Password!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('número');
      }
    });

    it('should reject passwords without special characters', () => {
      const result = passwordSchema.safeParse('Password123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('caractere especial');
      }
    });

    it('should reject passwords that are too short', () => {
      const result = passwordSchema.safeParse('Pass1!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8 caracteres');
      }
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'P'.repeat(95) + 'assw0rd!'; // 104 characters
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 caracteres');
      }
    });
  });

  describe('createAdminSchema', () => {
    const validAdminData = {
      name: 'John Doe',
      email: 'john@gmail.com', // Usando um domínio comum que não está bloqueado
      phone: '11999887766',
      password: 'SecurePass123!',
      adminSecret: 'validadminsecret123' // 19 caracteres - maior que 10
    };

    it('should accept valid admin data', () => {
      const result = createAdminSchema.safeParse(validAdminData);

      // Debug: se falhar, vamos ver o erro
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }

      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = { ...validAdminData, name: '' };
      const result = createAdminSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Name is required');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = { ...validAdminData, email: 'invalid-email' };
      const result = createAdminSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject blocked email domains', () => {
      const invalidData = { ...validAdminData, email: 'user@blocked.com' };
      const result = createAdminSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not valid or is from a restricted domain');
      }
    });

    it('should reject invalid phone format', () => {
      // Usando um email válido para garantir que o erro seja do telefone
      const invalidData = { ...validAdminData, phone: '123' };
      const result = createAdminSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Procurar pela mensagem de erro do telefone em todas as issues
        const phoneError = result.error.issues.find(issue =>
          issue.message.includes('Invalid phone number format')
        );
        expect(phoneError).toBeDefined();
        expect(phoneError?.message).toContain('Invalid phone number format');
      }
    });

    it('should reject short admin secret', () => {
      // Usando um email válido para garantir que o erro seja do adminSecret
      const invalidData = { ...validAdminData, adminSecret: 'short' };
      const result = createAdminSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Procurar pela mensagem de erro do adminSecret em todas as issues
        const secretError = result.error.issues.find(issue =>
          issue.message.includes('Invalid admin secret')
        );
        expect(secretError).toBeDefined();
        expect(secretError?.message).toContain('Invalid admin secret');
      }
    });

    it('should reject invalid password', () => {
      const invalidData = { ...validAdminData, password: 'weak' };
      const result = createAdminSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('publicUserSchema', () => {
    const validUserData = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '11999887766',
      plan: 'TRIAL',
      role: 'USER',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      status: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    it('should accept valid user data', () => {
      const result = publicUserSchema.safeParse(validUserData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const { id, ...incompleteData } = validUserData;
      const result = publicUserSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid data types', () => {
      const invalidData = { ...validUserData, status: 'true' }; // string instead of boolean
      const result = publicUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createAdminResponseSchema', () => {
    const validResponseData = {
      message: 'Admin created successfully',
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '11999887766',
        plan: 'PREMIUM',
        role: 'ADMIN',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        status: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    };

    it('should accept valid response data', () => {
      const result = createAdminResponseSchema.safeParse(validResponseData);
      expect(result.success).toBe(true);
    });

    it('should reject missing message', () => {
      const { message, ...incompleteData } = validResponseData;
      const result = createAdminResponseSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid user data', () => {
      const invalidData = {
        ...validResponseData,
        user: { ...validResponseData.user, id: undefined }
      };
      const result = createAdminResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});