import { isEmail, isInRange, isPhone, isString } from '@formpipe/validators';
import {
  FormData,
  FormResponse,
  InputError,
  ValidationConstraints,
  ValidatorConstraints,
} from 'src/domain/types';

/**
 * FormValidator handles the validation of contact form data based on predefined rules.
 * It validates email, subject, and message fields according to the FormRules provided.
 */
export class FormValidator {
  private readonly rules: ValidatorConstraints;

  /**
   * Creates a new FormValidator instance
   * @param rules to be used for validation
   */
  constructor(rules: ValidatorConstraints) {
    this.rules = rules;
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
  validate(data: FormData): FormResponse {
    const inputErrors: InputError[] = [];

    const addError = (
      field: keyof FormData,
      value: string,
      message: string,
      rules: ValidationConstraints,
      type: 'validation' = 'validation'
    ) => {
      inputErrors.push({ field, value, message, rules, type });
    };

    for (const key of Object.keys(this.rules)) {
      const fieldKey = key as keyof FormData;
      const fieldRules = this.rules[fieldKey];
      const value = data[fieldKey]?.trim() ?? '';

      if (fieldRules.required && !value) {
        addError(fieldKey, value, `${key} is required`, fieldRules);
        continue;
      }

      if (!value) continue;

      if (fieldKey === 'replyTo' && fieldRules.isEmail && !isEmail(value)) {
        addError(fieldKey, value, 'Invalid email address', fieldRules);
      }
      if (
        fieldKey === 'phoneNumber' &&
        fieldRules.phoneValidationMode &&
        !isPhone(value, fieldRules.phoneValidationMode || 'e164')
      ) {
        addError(fieldKey, value, 'Invalid phone number', fieldRules);
      }

      if (!isString(value)) {
        addError(fieldKey, value, `Invalid ${key}`, fieldRules);
        continue;
      }

      if (
        fieldRules.minLength &&
        fieldRules.maxLength &&
        !isInRange(value, fieldRules.minLength, fieldRules.maxLength)
      ) {
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
        message: 'Validation failed',
        errors: inputErrors,
        data: { fields: data, rules: this.rules },
      };
    }

    return {
      success: true,
      status: 200,
      message: 'Validation passed',
      errors: null,
      data: { fields: data, rules: this.rules },
    };
  }
}
