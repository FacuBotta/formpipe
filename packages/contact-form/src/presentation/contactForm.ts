import {
  FormData,
  FormFields,
  FormResponse,
  FormRules,
  Rules,
  SubmitProps,
} from 'src/domain/types';
import { FormSubmitter } from '../application/services/FormSubmitter';
import { FormValidator } from '../application/services/FormValidator';
import { FormConfig, loadConfig } from '../domain/entities/FormConfig';

export class ContactForm {
  private readonly formpipeConfig: FormConfig;
  private readonly validator: FormValidator;
  private readonly submitter: FormSubmitter;
  private readonly formRules: FormRules;
  private readonly localStorageKey = 'formpipe-contact-form';

  constructor(rules?: Rules) {
    // Load and validate config first
    const config = loadConfig();
    if (!config) {
      throw new Error(
        'No config() set up yet, make sure you run npx formpipe init first'
      );
    }
    this.formpipeConfig = config;

    // Base rules that will be used if nothing else is provided
    const defaultRules: FormRules = {
      message: { minLength: 10, maxLength: 300, required: true },
      replyTo: { minLength: 5, maxLength: 50, required: true },
      subject: { minLength: 5, maxLength: 100, required: false },
    };

    // Combine rules for each field individually
    this.formRules = {
      message: {
        ...defaultRules.message,
        ...this.formpipeConfig.rules?.message,
        ...rules?.message,
      },
      replyTo: {
        ...defaultRules.replyTo,
        ...this.formpipeConfig.rules?.replyTo,
        ...rules?.replyTo,
      },
      subject: {
        ...defaultRules.subject,
        ...this.formpipeConfig.rules?.subject,
        ...rules?.subject,
      },
    };

    this.validator = new FormValidator(this.formRules);
    this.submitter = new FormSubmitter();
  }

  /**
   * Validates form data using the configured validator.
   * Performs validation checks on replyTo, subject, and message fields based on the defined rules.
   *
   * @param data - The form data to validate
   * @returns FormResponse containing success status and validation errors if any
   * @throws Will return a system error if validator is not initialized
   *
   * @example
   * const form = new contactForm();
   * const result = form.validate({
   *   replyTo: 'user@example.com',
   *   subject: 'Hello',
   *   message: 'Test message'
   * });
   */
  validate(data: FormData, rules?: Rules): FormResponse {
    if (!this.validator) {
      return {
        success: false,
        status: 500,
        error: {
          type: 'system',
          message:
            'Form validator not initialized. make sure you run npx formpipe init first',
        },
      };
    }

    // Combine instance rules with ad-hoc rules if provided
    const combinedRules: FormRules = { ...this.formRules };

    if (rules) {
      Object.keys(rules).forEach((field) => {
        const key = field as keyof FormFields;
        if (rules[key]) {
          combinedRules[key] = {
            ...combinedRules[key],
            ...rules[key],
          };
        }
      });
    }

    const { errors: validationErrors, rules: rulesApplied } =
      this.validator.validate(data, combinedRules);
    if (validationErrors.length > 0) {
      return {
        success: false,
        status: 400,
        error: validationErrors.map((error) => ({
          ...error,
          type: 'validation' as const,
        })),
        rules: rulesApplied,
      };
    }

    return {
      success: true,
      status: 200,
      data: data,
      rules: rulesApplied,
    };
  }

  async submit(data: SubmitProps): Promise<FormResponse> {
    if (!this.formpipeConfig || !this.submitter) {
      return {
        success: false,
        status: 500,
        error: {
          type: 'system',
          message:
            'No config() set up yet, make sure you run npx formpipe init first',
        },
        rules: this.formRules
      };
    }

    // Validate first
    const validationResult = this.validate(data);
    if (!validationResult.success) {
      return validationResult;
    }

    // Handle rate limiting
    const isRateLimited = await this.checkRateLimit();
    if (isRateLimited) {
      return {
        success: false,
        status: 429,
        error: {
          type: 'system',
          message: 'Too many requests, please try again later',
        },
        rules: this.formRules
      };
    }

    // Persist data if requested
    if (data.options?.persistData) {
      const formData = {
        replyTo: data.replyTo,
        subject: data.subject,
        message: data.message,
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(formData));
    }

    try {
      const response = await this.submitter.submit({
        replyTo: data.replyTo,
        subject: data.subject,
        message: data.message,
        url: this.formpipeConfig.baseURL,
      });

      // Clear storage on success if persistence was requested
      if (response?.ok && data.options?.persistData) {
        localStorage.removeItem(this.localStorageKey);
      }

      return {
        success: true,
        status: 200,
        data: data,
        rules: this.formRules
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        error: {
          type: 'system',
          message: 'Failed to submit form',
          details: error,
        },
        rules: this.formRules
      };
    }
  }

  // Helpers
  private async checkRateLimit(): Promise<boolean> {
    // TODO: This have to take an answer from the backend
    return false;
  }

  loadFromStorage(): FormData | null {
    const saved = localStorage.getItem(this.localStorageKey);
    if (saved) return JSON.parse(saved);
    return null;
  }
}
