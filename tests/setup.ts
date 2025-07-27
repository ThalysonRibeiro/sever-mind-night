
// import { execSync } from 'child_process';
// import { afterAll, beforeAll } from '@jest/globals';
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';

// dotenv.config({ path: '.env.test' });

// beforeAll(() => {
//   // Clean up previous test database
//   if (fs.existsSync('test.db')) {
//     fs.unlinkSync('test.db');
//   }
//   // Run migrations
//   execSync('npx prisma migrate deploy');
// });

// afterAll(() => {
//   // Clean up test database
//   if (fs.existsSync('test.db')) {
//     fs.unlinkSync('test.db');
//   }
// });

import { config } from 'dotenv';

// Carregar variáveis de ambiente de teste
config({ path: '.env.test' });

// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.ADMIN_SECRET = process.env.ADMIN_SECRET || 'test_admin_secret_12345';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

// Mock console para testes mais limpos (opcional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}