import { isEmail, isInRange, isString } from '@formpipe/validators';
import { FormConfig } from '../../domain/entities/FormConfig';

export class FormValidator {
  constructor(private config: FormConfig) {}

  validate(data: { replyTo: string; subject: string; message: string }) {
    const errors: string[] = [];

    // Required fields
    if (!data.replyTo) errors.push('Email is required');
    if (this.config.rules.subject.required && !data.subject)
      errors.push('Subject is required');
    if (this.config.rules.message.required && !data.message)
      errors.push('Message is required');

    // Validations using @formpipe/validators methods

    // Email
    if (!isEmail(data.replyTo)) errors.push('Invalid email address');

    // Subject
    if (!isString(data.subject)) errors.push('Invalid subject');
    if (
      !isInRange(
        data.subject,
        this.config.rules.subject.minLength,
        this.config.rules.subject.maxLength
      )
    )
      errors.push(
        `Subject must be between ${this.config.rules.subject.minLength}-${this.config.rules.subject.maxLength} characters`
      );

    // Message
    if (!isString(data.message)) errors.push('Invalid message');
    if (
      !isInRange(
        data.message,
        this.config.rules.message.minLength,
        this.config.rules.message.maxLength
      )
    )
      errors.push(
        `Message must be between ${this.config.rules.message.minLength}-${this.config.rules.message.maxLength} characters`
      );

    return errors;
  }
}
