import { FormData, FormResponse, SubmitProps } from 'src/domain/types';
import { FormSubmitter } from '../application/services/FormSubmitter';
import { FormValidator } from '../application/services/FormValidator';
import { FormConfig, loadConfig } from '../domain/entities/FormConfig';

export class contactForm {
  private formpipeConfig?: FormConfig = loadConfig();
  private validator?: FormValidator;
  private submitter?: FormSubmitter;

  private localStorageKey = 'formpipe-contact-form';

  constructor() {
    if (this.formpipeConfig) {
      this.validator = new FormValidator(this.formpipeConfig.rules);
      this.submitter = new FormSubmitter();
    } else {
      throw new Error(
        'No config() set up yet, make sure you run npx formpipe init first'
      );
    }
  }

  validate(data: FormData): FormResponse {
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

    const validationErrors = this.validator.validate(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        status: 400,
        error: validationErrors.map((error) => ({
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
        error: {
          type: 'system',
          message:
            'No config() set up yet, make sure you run npx formpipe init first',
        },
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
      const response = await this.submitter.submitForm({
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
