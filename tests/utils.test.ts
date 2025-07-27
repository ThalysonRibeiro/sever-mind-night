import { describe, it, expect } from '@jest/globals';
import { isValidEmail } from '../src/utils/emailValidation.ts';
import { PLANS_INTERPRETATION_QUOTA } from '../src/utils/constants.ts';

describe('Utils', () => {
  describe('Email Validation', () => {
    it('should validate valid email addresses', () => {
      const validEmails = [
        'user@gmail.com',
        'user.name@domain.co.uk',
        'user+tag@outlook.com',
        '123@hotmail.com',
        'test@subdomain.valid.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '',
        '   ',
      ];

      invalidEmails.forEach(email => {
        const result = isValidEmail(email);
        if (result !== false) {
          console.log(`Email "${email}" should be invalid but returned ${result}`);
        }
        expect(result).toBe(false);
      });
    });

    it('should reject emails from restricted domains', () => {
      const restrictedEmails = [
        'test@tempmail.com',
        'user@10minutemail.com',
        'test@guerrillamail.com',
        'user@mailinator.com',
      ];

      restrictedEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    it('should have correct interpretation quota for TRIAL plan', () => {
      expect(PLANS_INTERPRETATION_QUOTA.TRIAL).toBeDefined();
      expect(PLANS_INTERPRETATION_QUOTA.TRIAL.dailyCredits).toBeDefined();
      expect(PLANS_INTERPRETATION_QUOTA.TRIAL.weeklyCredits).toBeDefined();
      expect(typeof PLANS_INTERPRETATION_QUOTA.TRIAL.dailyCredits).toBe('number');
      expect(typeof PLANS_INTERPRETATION_QUOTA.TRIAL.weeklyCredits).toBe('number');
    });

    it('should have correct interpretation quota for FREE plan', () => {
      expect(PLANS_INTERPRETATION_QUOTA.FREE).toBeDefined();
      expect(PLANS_INTERPRETATION_QUOTA.FREE.dailyCredits).toBeDefined();
      expect(PLANS_INTERPRETATION_QUOTA.FREE.weeklyCredits).toBeDefined();
      expect(typeof PLANS_INTERPRETATION_QUOTA.FREE.dailyCredits).toBe('number');
      expect(typeof PLANS_INTERPRETATION_QUOTA.FREE.weeklyCredits).toBe('number');
    });

    it('should have correct interpretation quota for PREMIUM plan', () => {
      expect(PLANS_INTERPRETATION_QUOTA.PREMIUM).toBeDefined();
      expect(PLANS_INTERPRETATION_QUOTA.PREMIUM.dailyCredits).toBeDefined();
      expect(PLANS_INTERPRETATION_QUOTA.PREMIUM.weeklyCredits).toBeDefined();
      expect(typeof PLANS_INTERPRETATION_QUOTA.PREMIUM.dailyCredits).toBe('number');
      expect(typeof PLANS_INTERPRETATION_QUOTA.PREMIUM.weeklyCredits).toBe('number');
    });

    it('should have higher credits for higher tier plans', () => {
      expect(PLANS_INTERPRETATION_QUOTA.PREMIUM.dailyCredits).toBeGreaterThanOrEqual(
        PLANS_INTERPRETATION_QUOTA.FREE.dailyCredits
      );
      expect(PLANS_INTERPRETATION_QUOTA.PREMIUM.weeklyCredits).toBeGreaterThanOrEqual(
        PLANS_INTERPRETATION_QUOTA.FREE.weeklyCredits
      );
      expect(PLANS_INTERPRETATION_QUOTA.FREE.dailyCredits).toBeGreaterThanOrEqual(
        PLANS_INTERPRETATION_QUOTA.TRIAL.dailyCredits
      );
      expect(PLANS_INTERPRETATION_QUOTA.FREE.weeklyCredits).toBeGreaterThanOrEqual(
        PLANS_INTERPRETATION_QUOTA.TRIAL.weeklyCredits
      );
    });
  });
}); 