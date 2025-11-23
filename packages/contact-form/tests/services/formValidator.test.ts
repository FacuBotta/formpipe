import { describe, expect, it } from 'vitest';
import {
  FormData,
  InputError,
  ValidatorConstraints,
} from '../../src/domain/types';
import { FormValidator } from '../../src/services/FormValidator';

const rules: ValidatorConstraints = {
  replyTo: { minLength: 5, maxLength: 50, required: true, isEmail: true },
  subject: { minLength: 5, maxLength: 100, required: true },
  message: { minLength: 10, maxLength: 1000, required: true },
};

const validator = new FormValidator(rules);

describe('FormValidator', () => {
  it('should validate form data against the rules', () => {
    const correctData: FormData = {
      replyTo: 'email@example.com',
      subject: 'Test Subject',
      message: 'Test Message long enough',
    };

    const result = validator.validate(correctData);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.message).toBe('Validation passed');
    expect(result.errors).toBeNull();
    expect(result.data?.fields).toEqual(correctData);
  });

  it('should return errors for invalid form data', () => {
    const invalidData: FormData = {
      replyTo: 'bademail',
      subject: 'S',
      message: '',
    };

    const result = validator.validate(invalidData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toBe('Validation failed');
    expect(result.errors).toHaveLength(3);

    const [emailError, subjectError, messageError] = result.errors!;

    expect(emailError.message).toContain('Invalid email address');
    expect(subjectError.message).toContain('must be between');
    expect(messageError.message).toContain('is required');
  });

  it('should return error for missing required email', () => {
    const invalidData: FormData = {
      replyTo: '',
      subject: 'Test Subject',
      message: 'Valid message',
    };

    const result = validator.validate(invalidData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.errors).toHaveLength(1);

    const [error] = result.errors! as InputError[];
    expect(error.field).toBe('replyTo');
    expect(error.message).toBe('replyTo is required');
  });

  it('should return error for missing required subject when required', () => {
    const invalidData: FormData = {
      replyTo: 'email@example.com',
      subject: '',
      message: 'Test Message valid length',
    };

    const result = validator.validate(invalidData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.errors).toHaveLength(1);

    const [error] = result.errors! as InputError[];
    expect(error.field).toBe('subject');
    expect(error.message).toBe('subject is required');
  });

  it('should return error for message too short', () => {
    const invalidData: FormData = {
      replyTo: 'email@example.com',
      subject: 'Test Subject',
      message: 'Short',
    };

    const result = validator.validate(invalidData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.errors).toHaveLength(1);

    const [error] = result.errors! as InputError[];
    expect(error.field).toBe('message');
    expect(error.message).toContain('must be between');
  });
});
