import { describe, expect, it } from 'vitest';
import { FormValidator } from '../../src/application/services/FormValidator';
import { FormData, ValidatorConstraints } from '../../src/domain/types';

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
      message: 'Test Message',
    };

    const result = validator.validate(correctData);
    expect(result).toEqual({
      errors: [],
    });
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
        rules: {
          minLength: rules.replyTo.minLength,
          maxLength: rules.replyTo.maxLength,
          required: true,
          isEmail: true,
        },
      },
      {
        message: `subject must be between ${rules.subject.minLength} and ${rules.subject.maxLength} characters`,
        field: 'subject',
        value: 'S',
        type: 'validation',
        rules: {
          minLength: rules.subject.minLength,
          maxLength: rules.subject.maxLength,
          required: rules.subject.required,
        },
      },
      {
        message: 'message is required',
        field: 'message',
        value: '',
        type: 'validation',
        rules: {
          required: rules.message.required,
          minLength: rules.message.minLength,
          maxLength: rules.message.maxLength,
        },
      },
    ];

    const result = validator.validate(invalidData);
    expect(result.errors).toHaveLength(expectedErrors.length);
    expect(result).toEqual({
      errors: expect.arrayContaining(expectedErrors),
    });
  });

  it('should return error for missing required email', () => {
    const invalidData: FormData = {
      replyTo: '',
      subject: 'Test Subject',
      message: 'Test Message',
    };

    const result = validator.validate(invalidData);
    expect(result.errors).toHaveLength(1);
    expect(result).toEqual({
      errors: [
        {
          message: 'replyTo is required',
          field: 'replyTo',
          value: '',
          type: 'validation',
          rules: {
            isEmail: true,
            required: true,
            minLength: rules.replyTo.minLength,
            maxLength: rules.replyTo.maxLength,
          },
        },
      ],
    });
  });

  it('should return error for missing required subject when required', () => {
    const invalidData: FormData = {
      replyTo: 'email@example.com',
      subject: '',
      message: 'Test Message',
    };

    const result = validator.validate(invalidData);
    expect(result.errors).toHaveLength(1);
    expect(result).toEqual({
      errors: [
        {
          message: 'subject is required',
          field: 'subject',
          value: '',
          type: 'validation',
          rules: {
            required: true,
            minLength: rules.subject.minLength,
            maxLength: rules.subject.maxLength,
          },
        },
      ],
    });
  });

  it('should return error for message too short', () => {
    const invalidData: FormData = {
      replyTo: 'email@example.com',
      subject: 'Test Subject',
      message: 'Short',
    };

    const result = validator.validate(invalidData);
    expect(result.errors).toHaveLength(1);
    expect(result).toEqual({
      errors: [
        {
          message: `message must be between ${rules.message.minLength} and ${rules.message.maxLength} characters`,
          field: 'message',
          value: 'Short',
          type: 'validation',
          rules: {
            minLength: rules.message.minLength,
            maxLength: rules.message.maxLength,
            required: rules.message.required,
          },
        },
      ],
    });
  });
});
