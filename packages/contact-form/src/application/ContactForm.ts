import {
  FormConfig,
  FormData,
  FormResponse,
  SubmitProps,
  ValidationProps,
  ValidatorConstraints,
} from 'src/domain/types';
import { FormSubmitter } from '../services/FormSubmitter';
import { FormValidator } from '../services/FormValidator';

export class ContactForm {
  private readonly endPointPath: string;
  private readonly rateLimit: number;
  private readonly validator: FormValidator;
  private readonly submitter: FormSubmitter;
  private readonly formRules: ValidatorConstraints;
  private readonly localStorageKey = 'formpipe-contact-form';
  private readonly rateLimitStorageKey = 'formpipe-rate-limit';

  constructor(
    config: Pick<FormConfig, 'rules' | 'endPointPath' | 'rateLimit'>
  ) {
    if (!config || !config.endPointPath || !config.rules) {
      throw new Error('No config provided');
    }

    this.formRules = config.rules;
    this.endPointPath = config.endPointPath;
    this.rateLimit = config.rateLimit;

    this.validator = new FormValidator(this.formRules);
    this.submitter = new FormSubmitter(this.endPointPath);
  }

  /**
   * Checks if the client is within the rate limit using localStorage.
   * Uses a time-window based approach to track submission attempts.
   *
   * @returns Object with allowed status and remaining time if blocked
   */
  private checkRateLimit(): { allowed: boolean; resetIn?: number } {
    if (this.rateLimit === 0) {
      return { allowed: true };
    }

    const now = Math.floor(Date.now() / 1000);
    const windowSize = 60; // 60 second window
    let rateLimitData: { attempts: number; windowStart: number } = {
      attempts: 0,
      windowStart: now,
    };

    try {
      const stored = localStorage.getItem(this.rateLimitStorageKey);
      if (stored) {
        rateLimitData = JSON.parse(stored);
      }
    } catch {
      // If localStorage is corrupted, reset it
      rateLimitData = { attempts: 0, windowStart: now };
    }

    const elapsed = now - rateLimitData.windowStart;

    // If window has expired, reset the counter
    if (elapsed >= windowSize) {
      rateLimitData = { attempts: 1, windowStart: now };
      localStorage.setItem(
        this.rateLimitStorageKey,
        JSON.stringify(rateLimitData)
      );
      return { allowed: true };
    }

    // Check if limit exceeded
    if (rateLimitData.attempts >= this.rateLimit) {
      const resetIn = windowSize - elapsed;
      return { allowed: false, resetIn };
    }

    // Increment attempt counter
    rateLimitData.attempts += 1;
    localStorage.setItem(
      this.rateLimitStorageKey,
      JSON.stringify(rateLimitData)
    );
    return { allowed: true };
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
  validate(data: ValidationProps): FormResponse {
    if (!this.validator) {
      return {
        success: false,
        status: 500,
        message:
          'Form validator not initialized. make sure you run npx formpipe init first',
        data: {
          fields: data,
          rules: this.formRules,
          url: this.endPointPath,
        },
        errors: [
          {
            type: 'system',
            message:
              'Form validator not initialized. make sure you run npx formpipe init first',
          },
        ],
      };
    }

    const validatorResponse = this.validator.validate(data);
    if (!validatorResponse.success) {
      return {
        success: false,
        status: 400,
        message: 'Validation errors',
        data: {
          fields: data,
          rules: this.formRules,
          url: this.endPointPath,
        },
        errors: validatorResponse.errors,
      };
    }

    return {
      success: true,
      status: 200,
      message: 'Validation successful',
      data: {
        fields: data,
        rules: this.formRules,
        url: this.endPointPath,
      },
      errors: null,
    };
  }

  async submit(data: SubmitProps): Promise<FormResponse> {
    const { fields } = data;
    if (!this.endPointPath || !this.formRules || !this.submitter || !fields) {
      return {
        success: false,
        status: 500,
        message:
          'No config() set up yet, make sure you run npx formpipe init first',
        data: {
          fields,
          url: this.endPointPath,
          rules: this.formRules,
        },
        errors: [
          {
            type: 'system',
            message:
              'No config() set up yet, make sure you run npx formpipe init first',
          },
        ],
      };
    }

    // Check client-side rate limit
    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        status: 429,
        message: 'Too many requests. Please try again later.',
        data: {
          fields,
          url: this.endPointPath,
          rules: this.formRules,
        },
        errors: [
          {
            type: 'system',
            message: `Too many requests. Please try again in ${rateLimitCheck.resetIn} seconds.`,
          },
        ],
      };
    }

    if (data.options?.persistData) {
      localStorage.setItem(this.localStorageKey, JSON.stringify(fields));
    }

    const validationResult = this.validate(fields);
    if (!validationResult.success) {
      return validationResult;
    }

    try {
      const response = await this.submitter.submit(fields);

      if (!response.success) {
        return {
          success: response.success,
          status: response.status,
          message: response.message,
          data: {
            fields,
            url: this.endPointPath,
            rules: this.formRules,
          },
          errors: response.errors || [],
        };
      }

      if (response?.success && data.options?.persistData) {
        localStorage.removeItem(this.localStorageKey);
      }

      return {
        success: response.success,
        status: response.status,
        message: response.message,
        data: {
          fields,
          url: this.endPointPath,
          rules: this.formRules,
        },
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        data: {
          fields,
          url: this.endPointPath,
          rules: this.formRules,
        },
        message: 'An error occurred while submitting the form',
        errors: [
          {
            type: 'system',
            message: 'An error occurred while submitting the form',
            data: error,
          },
        ],
      };
    }
  }

  loadFromStorage(): FormData | null {
    const saved = localStorage.getItem(this.localStorageKey);
    if (saved) return JSON.parse(saved);
    return null;
  }
}
