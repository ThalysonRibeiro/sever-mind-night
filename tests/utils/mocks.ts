
import { jest } from '@jest/globals';

export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

export const mockGoogleAuth = {
  verifyIdToken: jest.fn(),
};
