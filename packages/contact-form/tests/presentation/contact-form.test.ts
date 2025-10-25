import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormConfig } from '../../src/domain/entities/FormConfig';
import { FormData, SubmitProps } from '../../src/domain/types';
import { ContactForm } from '../../src/presentation/contactForm';

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

vi.mock('../../src/domain/entities/FormConfig', async () => {
  const actual = await vi.importActual('../../src/domain/entities/FormConfig');
  return {
    ...actual,
    loadConfig: vi.fn(),
  };
});

const mockConfig: Required<FormConfig> = {
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    user: 'user',
    pass: 'pass',
  },
  baseURL: 'http://example.com',
  from: '<from@example.com>',
  to: '<to@example.com>',
  rules: {
    replyTo: { minLength: 5, maxLength: 50, required: true },
    subject: { minLength: 5, maxLength: 100, required: true },
    message: { minLength: 10, maxLength: 1000, required: true },
  },
  sendConfirmation: false,
  rateLimit: 3600,
};

const validFormData: FormData = {
  replyTo: 'test@example.com',
  subject: 'Test Subject',
  message: 'This is a test message',
};

const invalidFormData: FormData = {
  replyTo: 'invalid-email',
  subject: 'S',
  message: 'Short',
};

describe('ContactForm', () => {
  let form: ContactForm;
  let mockFetch: typeof fetch;

  beforeEach(async () => {
    const { loadConfig } = await import('../../src/domain/entities/FormConfig');
    vi.mocked(loadConfig).mockReturnValue(mockConfig);

    form = new ContactForm();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    Object.defineProperty(form, 'formpipeConfig', {
      value: mockConfig,
      writable: true,
    });

    Object.defineProperty(form, 'validator', {
      value: {
        validate: vi.fn(),
      },
      writable: true,
    });

    Object.defineProperty(form, 'submitter', {
      value: {
        submit: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockLocalStorage.clear();
  });

  describe('validate method', () => {
    it('should use default rules when no rules are provided', () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });
      const result = form.validate(validFormData);

      expect(validator.validate).toHaveBeenCalledWith(
        validFormData,
        form['formRules']
      );
      expect(validator.validate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        status: 200,
        data: validFormData,
        rules: mockRules,
      });
    });

    it('should merge ad-hoc rules with default rules', () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const adHocRules = {
        message: { minLength: 20 }, // Sobrescribe el minLength default
        replyTo: { isEmail: true }, // Agrega una nueva regla
      };

      const expectedRules = {
        message: { ...mockConfig.rules.message, ...adHocRules.message },
        replyTo: { ...mockConfig.rules.replyTo, ...adHocRules.replyTo },
        subject: mockConfig.rules.subject,
      };

      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: expectedRules });
      const result = form.validate(validFormData, adHocRules);

      expect(validator.validate).toHaveBeenCalledWith(
        validFormData,
        expectedRules
      );
      expect(validator.validate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        status: 200,
        data: validFormData,
        rules: expectedRules,
      });
    });

    it('should handle empty ad-hoc rules object', () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });
      const result = form.validate(validFormData, {});

      expect(validator.validate).toHaveBeenCalledWith(
        validFormData,
        form['formRules']
      );
      expect(validator.validate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        status: 200,
        data: validFormData,
        rules: mockRules,
      });
    });

    it('should return system error when validator is not initialized', () => {
      // Simular que el validator no está inicializado
      Object.defineProperty(form, 'validator', {
        value: undefined,
        writable: true,
      });

      const result = form.validate(validFormData);

      expect(result).toEqual({
        success: false,
        status: 500,
        error: {
          type: 'system',
          message:
            'Form validator not initialized. make sure you run npx formpipe init first',
        },
      });
    });

    it('should return validation errors when validation fails', () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const mockRules = form['formRules'];
      const validationErrors = [
        {
          message: 'Message is too short',
          field: 'message',
          value: 'short',
          type: 'validation' as const,
          constraints: { minLength: 10 },
        },
      ];

      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: validationErrors, rules: mockRules });

      const result = form.validate(invalidFormData);

      expect(result).toEqual({
        success: false,
        status: 400,
        error: validationErrors,
        rules: mockRules,
      });
    });

    it('should return success when validation passes', () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });

      const result = form.validate(validFormData);

      expect(result).toEqual({
        success: true,
        status: 200,
        data: validFormData,
        rules: mockRules,
      });
    });

    it('should correctly combine and return multi-level validation rules', () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const baseRules = form['formRules'];
      const adHocRules = {
        message: {
          minLength: 50,
          customRule: true,
        },
        replyTo: {
          isEmail: true,
          pattern: /^[a-z]+@[a-z]+\.[a-z]{2,}$/,
        },
        subject: {
          required: true,
        },
      };

      const expectedRules = {
        message: { ...baseRules.message, ...adHocRules.message },
        replyTo: { ...baseRules.replyTo, ...adHocRules.replyTo },
        subject: { ...baseRules.subject, ...adHocRules.subject },
      };

      validator.validate = vi.fn().mockReturnValue({
        errors: [
          {
            message: 'Message too short',
            field: 'message',
            value: validFormData.message,
            type: 'validation',
            constraints: { minLength: 50 },
          },
        ],
        rules: expectedRules,
      });

      const result = form.validate(validFormData, adHocRules);

      expect(validator.validate).toHaveBeenCalledWith(
        validFormData,
        expectedRules
      );
      expect(result).toEqual({
        success: false,
        status: 400,
        error: [
          {
            message: 'Message too short',
            field: 'message',
            value: validFormData.message,
            type: 'validation',
            constraints: { minLength: 50 },
          },
        ],
        rules: expectedRules,
      });
    });
  });

  describe('submit method', () => {
    it('should return error when validation fails', async () => {
      const validator = form['validator'];
      if (!validator) throw new Error('Validator not found');

      const mockRules = form['formRules'];
      const validationErrors = [
        {
          message: 'Invalid email address',
          field: 'replyTo',
          value: 'invalid-email',
          type: 'validation',
        },
        {
          message: 'Subject must be between 5 and 100 characters',
          field: 'subject',
          value: 'S',
          type: 'validation',
          constraints: {
            minLength: 5,
            maxLength: 100,
          },
        },
        {
          message: 'Message must be between 10 and 1000 characters',
          field: 'message',
          value: 'Short',
          type: 'validation',
          constraints: {
            minLength: 10,
            maxLength: 1000,
          },
        },
      ];

      validator.validate = vi.fn().mockReturnValue({
        errors: validationErrors,
        rules: mockRules,
      });

      const submitProps: SubmitProps = {
        ...invalidFormData,
        options: { persistData: false },
      };

      const result = await form.submit(submitProps);
      expect(result).toEqual({
        success: false,
        status: 400,
        error: expect.arrayContaining(validationErrors),
        rules: mockRules,
      });
      expect(result.error).toHaveLength(validationErrors.length);
    }); // 👈 ← ESTA LLAVE Y PARÉNTESIS FALTABAN AQUÍ

    it('should submit successfully when validation passes', async () => {
      const validator = form['validator'];
      const submitter = form['submitter'];

      if (!validator) throw new Error('Validator not found');
      if (!submitter) throw new Error('Submitter not found');
      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });
      submitter.submit = vi
        .fn()
        .mockResolvedValue({ ok: true, data: 'success' });

      const submitProps: SubmitProps = {
        ...validFormData,
        options: { persistData: false },
      };

      const result = await form.submit(submitProps);

      expect(result).toEqual({
        success: true,
        status: 200,
        data: {
          replyTo: validFormData.replyTo,
          subject: validFormData.subject,
          message: validFormData.message,
          options: { persistData: false },
        },
        rules: form['formRules'],
      });
      expect(submitter.submit).toHaveBeenCalledWith({
        replyTo: validFormData.replyTo,
        subject: validFormData.subject,
        message: validFormData.message,
        url: mockConfig.baseURL,
      });
    });

    it('should persist data to localStorage when persistData option is true', async () => {
      const validator = form['validator'];
      const submitter = form['submitter'];

      if (!validator) throw new Error('Validator not found');
      if (!submitter) throw new Error('Submitter not found');
      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });
      submitter.submit = vi.fn().mockResolvedValue({ ok: true });

      const submitProps: SubmitProps = {
        ...validFormData,
        options: { persistData: true },
      };

      await form.submit(submitProps);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'formpipe-contact-form',
        JSON.stringify({
          replyTo: validFormData.replyTo,
          subject: validFormData.subject,
          message: validFormData.message,
        })
      );
    });

    it('should clear localStorage on successful submission when persistData is enabled', async () => {
      const validator = form['validator'];
      const submitter = form['submitter'];

      if (!validator) throw new Error('Validator not found');
      if (!submitter) throw new Error('Submitter not found');
      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });
      submitter.submit = vi.fn().mockResolvedValue({ ok: true });

      mockLocalStorage.setItem.mockImplementation(() => {});

      const submitProps: SubmitProps = {
        ...validFormData,
        options: { persistData: true },
      };

      await form.submit(submitProps);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'formpipe-contact-form'
      );
    });

    it('should return connection error when submitter throws an error', async () => {
      const validator = form['validator'];
      const submitter = form['submitter'];

      if (!validator) throw new Error('Validator not found');
      if (!submitter) throw new Error('Submitter not found');
      const mockRules = form['formRules'];
      validator.validate = vi
        .fn()
        .mockReturnValue({ errors: [], rules: mockRules });
      submitter.submit = vi.fn().mockRejectedValue(new Error('Network error'));

      const submitProps: SubmitProps = {
        ...validFormData,
        options: { persistData: false },
      };

      const result = await form.submit(submitProps);

      expect(result).toEqual({
        success: false,
        status: 500,
        error: {
          type: 'system',
          message: 'Failed to submit form',
          details: new Error('Network error'),
        },
        rules: form['formRules'],
      });
    });

    it('should throw error when no config is set up', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(form as any, 'formpipeConfig', 'get').mockReturnValue(undefined);

      const submitProps: SubmitProps = {
        ...validFormData,
        options: { persistData: false },
      };

      const result = await form.submit(submitProps);

      expect(result).toEqual({
        success: false,
        status: 500,
        error: {
          type: 'system',
          message:
            'No config() set up yet, make sure you run npx formpipe init first',
        },
        rules: form['formRules'],
      });
    });
  });
});
