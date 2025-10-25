import { describe, expect, it } from 'vitest';
import { isEmail } from '../src/isEmail';

describe('isEmail', () => {
  describe('valid emails', () => {
    const validEmails = [
      'test@mail.com',
      'user.name@domain.com',
      'user+label@domain.com',
      'user@subdomain.domain.com',
      'user123@domain.com',
      'user@domain-name.com',
    ];

    validEmails.forEach((email) => {
      it(`accepts ${email}`, () => {
        expect(isEmail(email)).toBe(true);
      });
    });
  });

  describe('invalid emails', () => {
    const invalidEmails = [
      'badmail', // No @ symbol
      '..test@domain.com', // Starts with dots
      'test..name@domain.com', // Consecutive dots
      'test@.domain.com', // Domain starts with dot
      'test@domain..com', // Consecutive dots in domain
      'test@domain.c', // TLD too short
      'test@domain.', // Domain ends with dot
      'test@domain', // No TLD
      'a@b.c', // Too short
      '..te........ste@example.com.eveil', // Multiple consecutive dots
      'test@domain.com.', // Trailing dot
      '.test@domain.com', // Leading dot
      'test.@domain.com', // Dot before @
      'te st@domain.com', // Space in local part
      'test@do main.com', // Space in domain
    ];

    invalidEmails.forEach((email) => {
      it(`rejects ${email}`, () => {
        expect(isEmail(email)).toBe(false);
      });
    });
  });
});
