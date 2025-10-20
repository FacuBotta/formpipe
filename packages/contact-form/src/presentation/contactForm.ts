import { FormSubmitter } from '../application/services/FormSubmitter';
import { FormValidator } from '../application/services/FormValidator';
import { FormConfig, loadConfig } from '../domain/entities/FormConfig';

export class contactForm {
  private formpipeConfig?: FormConfig = loadConfig();
  private validator?: FormValidator;
  private submitter?: FormSubmitter;

  private localStorageKey = 'formpipe-contact-form';

  async submit(data: { replyTo: string; subject: string; message: string }) {
    if (!this.formpipeConfig) throw new Error('No config() set up yet');

    if (this.formpipeConfig.persistData) {
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    }

    try {
      const errors = this.validator!.validate(data);
      if (errors.length > 0) {
        return { error: { message: errors[0], status: 400, all: errors } };
      }

      const response = { ok: true }; // Mocked response
      const result = { message: 'Form submitted successfully' };

      //TODO: Implements sendEmail service
      this.submitter?.submitForm({
        replyTo: data.replyTo,
        subject: data.subject,
        message: data.message,
        url: this.formpipeConfig.baseURL,
      });
      // Clear storage on success
      if (response.ok && this.formpipeConfig.persistData) {
        localStorage.removeItem(this.localStorageKey);
      }

      return { success: true, data: result };
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

  loadFromStorage() {
    if (this.formpipeConfig?.persistData) {
      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) return JSON.parse(saved);
    }
    return null;
  }
}
