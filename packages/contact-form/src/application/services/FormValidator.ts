import { isEmail, isInRange, isString } from '@formpipe/validators';
import {
  FormData,
  FormRules,
  ValidationConstraints,
  ValidationError,
} from 'src/domain/types';

export class FormValidator {
  constructor(private rules: FormRules) {}

  validate(data: FormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Helper para crear errores de validación
    const addError = (
      field: keyof FormData,
      value: string,
      message: string,
      constraints?: ValidationConstraints
    ) => {
      errors.push({
        type: 'validation',
        field,
        value,
        message,
        constraints,
      });
    };

    // Validación del email (siempre requerido)
    const email = data.replyTo?.trim() ?? '';
    if (!email) {
      addError('replyTo', email, 'Email is required', { required: true });
    } else if (!isEmail(email)) {
      addError('replyTo', email, 'Invalid email address');
    }

    // Validación del asunto
    const subject = data.subject?.trim() ?? '';
    if (this.rules.subject.required && !subject) {
      addError('subject', subject, 'Subject is required', { required: true });
    } else if (subject && !isString(subject)) {
      addError('subject', subject, 'Invalid subject');
    } else if (
      subject &&
      !isInRange(
        subject,
        this.rules.subject.minLength,
        this.rules.subject.maxLength
      )
    ) {
      addError(
        'subject',
        subject,
        `Subject must be between ${this.rules.subject.minLength} and ${this.rules.subject.maxLength} characters`,
        {
          minLength: this.rules.subject.minLength,
          maxLength: this.rules.subject.maxLength,
        }
      );
    }

    // Validación del mensaje
    const message = data.message?.trim() ?? '';
    if (this.rules.message.required && !message) {
      addError('message', message, 'Message is required', { required: true });
    } else if (message && !isString(message)) {
      addError('message', message, 'Invalid message');
    } else if (
      message &&
      !isInRange(
        message,
        this.rules.message.minLength,
        this.rules.message.maxLength
      )
    ) {
      addError(
        'message',
        message,
        `Message must be between ${this.rules.message.minLength} and ${this.rules.message.maxLength} characters`,
        {
          minLength: this.rules.message.minLength,
          maxLength: this.rules.message.maxLength,
        }
      );
    }

    return errors;
  }
}
