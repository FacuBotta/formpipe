import { FormData, FormError, SubmitProps } from 'src/domain/types';
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
      throw new Error('No config() set up yet');
    }
  }

  validate(data: FormData): FormError[] {
    if (!this.validator) {
      throw new Error('No validator set up yet');
    }
    return this.validator.validate(data);
  }

  async submit(data: SubmitProps) {
    if (!this.formpipeConfig) throw new Error('No config() set up yet');

    if (data.options?.persistData) {
      localStorage.setItem(
        this.localStorageKey,
        JSON.stringify({
          replyTo: data.replyTo,
          subject: data.subject,
          message: data.message,
        })
      );
    }

    try {
      const errors = this.validator!.validate(data);
      if (errors.length > 0) {
        return { error: { message: errors[0], status: 400, all: errors } };
      }

      //TODO: Implements sendEmail service properly
      const response = await this.submitter?.submitForm({
        replyTo: data.replyTo,
        subject: data.subject,
        message: data.message,
        url: this.formpipeConfig.baseURL,
      });
      // Clear storage on success
      if (response?.ok && data.options?.persistData) {
        localStorage.removeItem(this.localStorageKey);
      }

      return { success: true, data: response };
    } catch (error) {
      return {
        error: {
          message: 'Connection error',
          status: 500,
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
