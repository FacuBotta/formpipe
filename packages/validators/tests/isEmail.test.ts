import { describe, expect, it } from 'vitest';
import { isEmail } from '../src/isEmail';

describe('isEmail', () => {
  it('validates correct emails', () => {
    expect(isEmail('test@mail.com')).toBe(true);
  });
  it('rejects invalid emails', () => {
    expect(isEmail('badmail')).toBe(false);
  });
  it('rejects invalid emails', () => {
    expect(isEmail('..te........ste@example.com.eveil')).toBe(false);
  });
});
