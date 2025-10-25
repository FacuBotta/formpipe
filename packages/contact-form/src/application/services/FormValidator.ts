import { isEmail, isInRange, isString } from '@formpipe/validators';
import {
  FormData,
  FormRules,
  ValidationConstraints,
  ValidationError,
} from 'src/domain/types';

/**
 * FormValidator handles the validation of contact form data based on predefined rules.
 * It validates email, subject, and message fields according to the FormRules provided.
 */
export class FormValidator {
  /**
   * Default validation rules if none are provided
   */
  private static readonly DEFAULT_RULES: FormRules = {
    message: { minLength: 10, maxLength: 300, required: true },
    replyTo: { minLength: 5, maxLength: 50, required: true },
    subject: { minLength: 5, maxLength: 100, required: false },
  };

  private readonly formRules: FormRules;

  /**
   * Creates a new FormValidator instance
   * @param rules - Optional custom validation rules that will be merged with default rules
   */
  constructor(rules?: Partial<FormRules>) {
    this.formRules = {
      replyTo: { ...FormValidator.DEFAULT_RULES.replyTo, ...rules?.replyTo },
      subject: { ...FormValidator.DEFAULT_RULES.subject, ...rules?.subject },
      message: { ...FormValidator.DEFAULT_RULES.message, ...rules?.message },
    };
  }

  /**
   * Validates form data against the defined rules.
   *
   * @param data - The form data to validate containing replyTo, subject, and message
   * @returns Array of validation errors if any rules are violated, empty array if validation passes
   *
   * @example
   * const validator = new FormValidator(rules);
   * const errors = validator.validate({
   *   replyTo: 'user@example.com',
   *   subject: 'Test Subject',
   *   message: 'Test Message'
   * });
   */
  validate(data: FormData): ValidationError[] {
    const errors: ValidationError[] = [];

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

    for (const key of Object.keys(data)) {
      const value = data[key as keyof FormData]?.trim() ?? '';
      const rules = this.formRules[key as keyof FormRules];
      if (key === 'replyTo' && value && !isEmail(value)) {
        addError(key as keyof FormData, value, 'invalid email address');
      }
      if (rules?.required && !value) {
        addError(key as keyof FormData, value, `${key} is required`, {
          required: true,
        });
      } else if (value && !isString(value)) {
        addError(key as keyof FormData, value, `Invalid ${key}`);
      } else if (value && !isInRange(value, rules.minLength, rules.maxLength)) {
        const { minLength, maxLength } = rules;
        addError(
          key as keyof FormData,
          value,
          `${key} must be between ${minLength} and ${maxLength} characters`,
          { minLength, maxLength }
        );
      }
    }

    return errors;
  }
}
