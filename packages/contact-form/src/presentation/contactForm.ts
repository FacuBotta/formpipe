import {
  FormData,
  FormFields,
  FormResponse,
  FormRules,
  SubmitProps,
  ValidatorConstraints,
} from 'src/domain/types';
import { FormSubmitter } from '../application/services/FormSubmitter';
import { FormValidator } from '../application/services/FormValidator';
import { FormConfig, loadConfig } from '../domain/entities/FormConfig';

export class ContactForm {
  private readonly formpipeConfig: FormConfig;
  private readonly endPointPath: string;
  private readonly validator: FormValidator;
  private readonly submitter: FormSubmitter;
  private readonly formRules: ValidatorConstraints;
  private readonly localStorageKey = 'formpipe-contact-form';

  constructor(rules?: FormRules) {
    // Load and validate config first
    const config = loadConfig();
    if (!config || !config.phpPath) {
      throw new Error(
        'No config() set up yet, make sure you run npx formpipe init first'
      );
    }
    this.formpipeConfig = config;

    // Base rules that will be used if nothing else is provided
    const defaultRules: ValidatorConstraints = {
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

    // Normalize baseURL and phpPath
    const baseURL = (this.formpipeConfig.baseURL || '').endsWith('/')
      ? this.formpipeConfig.baseURL
      : `${this.formpipeConfig.baseURL || ''}/`;

    const phpPath =
      (this.formpipeConfig.phpPath || './php/')
        .replace(/^\.\//, '') // Remove leading ./
        .replace(/\/+$/, '') + // Remove trailing slashes
      '/';

    this.endPointPath = `${baseURL}${phpPath}contact-form.php`;

    this.validator = new FormValidator(this.formRules);
    this.submitter = new FormSubmitter(this.endPointPath);
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
  validate(data: FormData, rules?: FormRules): FormResponse {
    if (!this.validator) {
      return {
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message:
            'Form validator not initialized. make sure you run npx formpipe init first',
        },
      };
    }

    // Combine instance rules with ad-hoc rules if provided
    const combinedRules: ValidatorConstraints = { ...this.formRules };

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

    const { errors: validationErrors } = this.validator.validate(
      data,
      combinedRules
    );
    if (validationErrors.length > 0) {
      return {
        success: false,
        status: 400,
        errors: validationErrors.map((error) => ({
          ...error,
          type: 'validation' as const,
        })),
      };
    }

    return {
      success: true,
      status: 200,
      data: data,
    };
  }

  async submit(data: SubmitProps): Promise<FormResponse> {
    if (!this.formpipeConfig || !this.submitter) {
      return {
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message:
            'No config() set up yet, make sure you run npx formpipe init first',
          data: null,
        },
      };
    }

    // Validate first
    const validationResult = this.validate(data.fields);
    if (!validationResult.success) {
      return validationResult;
    }

    // Persist data if requested
    if (data.options?.persistData) {
      const formData = {
        replyTo: data.fields.replyTo,
        subject: data.fields.subject,
        message: data.fields.message,
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(formData));
    }

    try {
      const response = await this.submitter.submit({
        replyTo: data.fields.replyTo,
        subject: data.fields.subject,
        message: data.fields.message,
      });

      // If the submitter failed, return the error
      if (!response.success) {
        return {
          success: false,
          status: response.status,
          errors: response.errors,
          response,
        };
      }

      // Clear storage on success if persistence was requested
      if (response?.success && data.options?.persistData) {
        localStorage.removeItem(this.localStorageKey);
      }

      return {
        success: true,
        status: response.status,
        errors: [],
        data: data.fields,
        response: response.data,
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        data: data.fields,
        errors: {
          type: 'system',
          message: 'Failed to submit form',
          data: error,
        },
      };
    }
  }

  loadFromStorage(): FormData | null {
    const saved = localStorage.getItem(this.localStorageKey);
    if (saved) return JSON.parse(saved);
    return null;
  }
}
