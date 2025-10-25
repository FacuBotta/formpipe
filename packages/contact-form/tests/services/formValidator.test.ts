import { describe, expect, it } from 'vitest';
import { FormValidator } from '../../src/application/services/FormValidator';
import { FormData, FormRules } from '../../src/domain/types';

const rules: FormRules = {
  replyTo: { minLength: 5, maxLength: 50, required: true },
  subject: { minLength: 5, maxLength: 100, required: true },
  message: { minLength: 10, maxLength: 1000, required: true },
};

const validator = new FormValidator(rules);

describe('FormValidator', () => {
  it('should validate form data against the rules', () => {
    const correctData: FormData = {
      replyTo: 'email@example.com',
      subject: 'Test Subject',
      message: 'Test Message',
    };

    const result = validator.validate(correctData);
    expect(result).toEqual([]);
  });

  it('should return errors for invalid form data', () => {
    const invalidData: FormData = {
      replyTo: 'bademail',
      subject: 'S',
      message: '',
    };

    const expectedErrors = [
      {
        message: 'Invalid email address',
        field: 'replyTo',
        value: 'bademail',
        type: 'validation',
      },
      {
        message: `Subject must be between ${rules.subject.minLength} and ${rules.subject.maxLength} characters`,
        field: 'subject',
        value: 'S',
        type: 'validation',
        constraints: {
          minLength: rules.subject.minLength,
          maxLength: rules.subject.maxLength,
        },
      },
      {
        message: 'Message is required',
        field: 'message',
        value: '',
        type: 'validation',
        constraints: { required: true },
      },
    ];

    const result = validator.validate(invalidData);
    expect(result).toHaveLength(expectedErrors.length);
    expect(result).toEqual(expect.arrayContaining(expectedErrors));
  }); // 👈 faltaba esta llave y paréntesis aquí

  it('should return error for missing required email', () => {
    const invalidData: FormData = {
      replyTo: '',
      subject: 'Test Subject',
      message: 'Test Message',
    };

    const result = validator.validate(invalidData);
    expect(result).toHaveLength(1);
    expect(result).toEqual([
      {
        message: 'Email is required',
        field: 'replyTo',
        value: '',
        type: 'validation',
        constraints: { required: true },
      },
    ]);
  });

  it('should return error for missing required subject when required', () => {
    const invalidData: FormData = {
      replyTo: 'email@example.com',
      subject: '',
      message: 'Test Message',
    };

    const result = validator.validate(invalidData);
    expect(result).toHaveLength(1);
    expect(result).toEqual([
      {
        message: 'Subject is required',
        field: 'subject',
        value: '',
        type: 'validation',
        constraints: { required: true },
      },
    ]);
  });

  it('should return error for message too short', () => {
    const invalidData: FormData = {
      replyTo: 'email@example.com',
      subject: 'Test Subject',
      message: 'Short',
    };

    const result = validator.validate(invalidData);
    expect(result).toHaveLength(1);
    expect(result).toEqual([
      {
        message: `Message must be between ${rules.message.minLength} and ${rules.message.maxLength} characters`,
        field: 'message',
        value: 'Short',
        type: 'validation',
        constraints: {
          minLength: rules.message.minLength,
          maxLength: rules.message.maxLength,
        },
      },
    ]);
  });
});
