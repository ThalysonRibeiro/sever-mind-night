
import { execSync } from 'child_process';
import { afterAll, beforeAll } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.test' });

beforeAll(() => {
  // Clean up previous test database
  if (fs.existsSync('test.db')) {
    fs.unlinkSync('test.db');
  }
  // Run migrations
  execSync('npx prisma migrate deploy');
});

afterAll(() => {
  // Clean up test database
  if (fs.existsSync('test.db')) {
    fs.unlinkSync('test.db');
  }
});
