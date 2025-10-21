import { isEmail, isInRange, isString } from '@formpipe/validators';
import { FormData, FormError, FormRules } from 'src/domain/types';

export class FormValidator {
  // eslint-disable-next-line no-unused-vars
  constructor(private rules: FormRules) {}

  validate(data: FormData): FormError[] {
    const errors: FormError[] = [];

    // Validar campos requeridos primero
    if (!data.replyTo || data.replyTo.trim() === '') {
      errors.push({
        message: 'Email is required',
        input: { replyTo: data.replyTo },
      });
    }

    if (
      this.rules.subject.required &&
      (!data.subject || data.subject.trim() === '')
    ) {
      errors.push({
        message: 'Subject is required',
        input: { subject: data.subject },
      });
    }

    if (
      this.rules.message.required &&
      (!data.message || data.message.trim() === '')
    ) {
      errors.push({
        message: 'Message is required',
        input: { message: data.message },
      });
    }

    // Validaciones de formato y longitud solo si el campo tiene contenido
    if (data.replyTo && data.replyTo.trim() !== '') {
      if (!isEmail(data.replyTo)) {
        errors.push({
          message: 'Invalid email address',
          input: { replyTo: data.replyTo },
        });
      }
    }

    if (data.subject && data.subject.trim() !== '') {
      if (!isString(data.subject)) {
        errors.push({
          message: 'Invalid subject',
          input: { subject: data.subject },
        });
      } else if (
        !isInRange(
          data.subject,
          this.rules.subject.minLength,
          this.rules.subject.maxLength
        )
      ) {
        errors.push({
          message: `Subject must be between ${this.rules.subject.minLength} and ${this.rules.subject.maxLength} characters`,
          input: { subject: data.subject },
        });
      }
    }

    if (data.message && data.message.trim() !== '') {
      if (!isString(data.message)) {
        errors.push({
          message: 'Invalid message',
          input: { message: data.message },
        });
      } else if (
        !isInRange(
          data.message,
          this.rules.message.minLength,
          this.rules.message.maxLength
        )
      ) {
        errors.push({
          message: `Message must be between ${this.rules.message.minLength} and ${this.rules.message.maxLength} characters`,
          input: { message: data.message },
        });
      }
    }

    return errors;
  }
}
