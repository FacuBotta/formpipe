import { isEmail, isInRange, isString } from '@formpipe/validators';
import {
  FormData,
  InputError,
  ValidationConstraints,
  ValidatorConstraints,
  ValidatorResponse,
} from 'src/domain/types';

/**
 * FormValidator handles the validation of contact form data based on predefined rules.
 * It validates email, subject, and message fields according to the FormRules provided.
 */
export class FormValidator {
  /**
   * Default validation rules if none are provided
   */
  private static readonly DEFAULT_RULES: ValidatorConstraints = {
    message: { minLength: 10, maxLength: 300, required: true },
    replyTo: { minLength: 5, maxLength: 50, required: true, isEmail: true },
    subject: { minLength: 5, maxLength: 100, required: false },
  };

  private readonly formRules: ValidatorConstraints;

  /**
   * Creates a new FormValidator instance
   * @param rules - Optional custom validation rules that will be merged with default rules
   */
  constructor(rules?: Partial<ValidatorConstraints>) {
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
  validate(data: FormData, rules?: ValidatorConstraints): ValidatorResponse {
    const inputErrors: InputError[] = [];
    const combinedRules = { ...this.formRules, ...rules };

    const addError = (
      field: keyof FormData,
      value: string,
      message: string,
      rules: ValidationConstraints
    ) => {
      inputErrors.push({ field, value, message, rules });
    };

    for (const key of Object.keys(combinedRules)) {
      const fieldKey = key as keyof FormData;
      const fieldRules = combinedRules[fieldKey];
      const value = data[fieldKey]?.trim() ?? '';

      if (fieldRules?.required && !value) {
        addError(fieldKey, value, `${key} is required`, fieldRules);
        continue;
      }

      if (!value) continue;

      if (fieldKey === 'replyTo' && fieldRules.isEmail && !isEmail(value)) {
        addError(fieldKey, value, 'Invalid email address', fieldRules);
      }

      if (!isString(value)) {
        addError(fieldKey, value, `Invalid ${key}`, fieldRules);
        continue;
      }

      if (!isInRange(value, fieldRules.minLength, fieldRules.maxLength)) {
        addError(
          fieldKey,
          value,
          `${key} must be between ${fieldRules.minLength} and ${fieldRules.maxLength} characters`,
          fieldRules
        );
      }
    }

    if (inputErrors.length > 0) {
      return {
        success: false,
        status: 400,
        type: 'validation',
        message: 'Validation failed',
        errors: inputErrors,
        data: { fields: data, rules: combinedRules },
      };
    }

    return {
      success: true,
      status: 200,
      type: 'validation',
      message: 'Validation passed',
      errors: null,
      data: { fields: data, rules: combinedRules },
    };
  }
}
