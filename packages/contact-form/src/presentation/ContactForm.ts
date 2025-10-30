import {
  AllowedFormFields,
  FormConfig,
  FormData,
  FormResponse,
  FormRules,
  SubmitProps,
  ValidatorConstraints,
} from 'src/domain/types';
import { FormSubmitter } from '../application/services/FormSubmitter';
import { FormValidator } from '../application/services/FormValidator';

export class ContactForm {
  private readonly endPointPath: string;
  private readonly validator: FormValidator;
  private readonly submitter: FormSubmitter;
  private readonly formRules: ValidatorConstraints;
  private readonly localStorageKey = 'formpipe-contact-form';

  constructor(config: Pick<FormConfig, 'rules' | 'endPointPath'>) {
    if (!config || !config.endPointPath || !config.rules) {
      throw new Error('No config provided');
    }

    this.formRules = config.rules;
    this.endPointPath = config.endPointPath;

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

    // Combine instance rules with ad-hoc rules if provided
    const combinedRules: ValidatorConstraints = { ...this.formRules };

    if (rules) {
      Object.keys(rules).forEach((field) => {
        const key = field as keyof AllowedFormFields;
        if (rules[key]) {
          combinedRules[key] = {
            ...combinedRules[key],
            ...rules[key],
          };
        }
      });
    }

    const validatorResponse = this.validator.validate(data, combinedRules);
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
    if (!this.endPointPath || !this.formRules || !this.submitter) {
      return {
        success: false,
        status: 500,
        message:
          'No config() set up yet, make sure you run npx formpipe init first',
        data: {
          fields: data.fields,
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
    // Persist data if requested
    if (data.options?.persistData) {
      const formData = {
        replyTo: data.fields.replyTo,
        subject: data.fields.subject,
        message: data.fields.message,
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(formData));
    }

    // Validate first
    const validationResult = this.validate(data.fields);
    if (!validationResult.success) {
      return validationResult;
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
          success: response.success,
          status: response.status,
          message: response.message,
          data: {
            fields: data.fields,
            url: this.endPointPath,
            rules: this.formRules,
          },
          errors: response.errors || [],
        };
      }

      // Clear storage on success if persistence was requested
      if (response?.success && data.options?.persistData) {
        localStorage.removeItem(this.localStorageKey);
      }

      return {
        success: response.success,
        status: response.status,
        message: response.message,
        data: {
          fields: data.fields,
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
          fields: data.fields,
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
